import { Router, Request, Response, NextFunction } from 'express';
import { query, getClient } from '../../config/db.js';
import { requireAuth, requirePermission, optionalAuth } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { mutationService } from '../mutation/mutation.service.js';
import { auditService } from '../audit/audit.service.js';
import { z } from 'zod';

const router = Router();

// GET /api/registrations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { parcelId } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (parcelId) {
      conditions.push(`r.parcel_id = $${pIdx++}`);
      params.push(parcelId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT r.*, p.ulpin, p.legacy_survey_no, p.village, p.area_sqm AS parcel_area_sqm
      FROM registrations r
      JOIN parcels p ON p.id = r.parcel_id
      ${whereClause}
      ORDER BY r.registration_date DESC
    `;

    const result = await query(sql, params);
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/registrations (Create synthetic registration -> automatically create mutation)
router.post(
  '/',
  requireAuth,
  requirePermission('mutation:submit'),
  validateRequest({
    body: z.object({
      parcelId: z.string().uuid(),
      documentNumber: z.string().min(3),
      registrationDate: z.string().optional(),
      deedType: z.string().default('SALE_DEED'),
      seller: z.string().min(2),
      buyer: z.string().min(2),
      buyerIdNumber: z.string().optional(),
      buyerPhone: z.string().optional(),
      buyerEmail: z.string().email().optional(),
      registeredAreaSqm: z.number().positive(),
      considerationAmount: z.number().nonnegative(),
      sroOffice: z.string().default('Sub-Registrar Office, Medchal'),
      marketValue: z.number().nonnegative().optional(),
      stampDutyPaid: z.number().nonnegative().optional(),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const {
        parcelId,
        documentNumber,
        registrationDate,
        deedType,
        seller,
        buyer,
        buyerIdNumber,
        buyerPhone,
        buyerEmail,
        registeredAreaSqm,
        considerationAmount,
        sroOffice,
        marketValue,
        stampDutyPaid,
      } = req.body;

      // 1. Insert registration record
      const regDate = registrationDate || new Date().toISOString().split('T')[0];
      const mVal = marketValue || considerationAmount;
      const sDuty = stampDutyPaid || Math.round(considerationAmount * 0.075);

      const regRes = await client.query(
        `INSERT INTO registrations (
          parcel_id, document_number, seller, buyer,
          seller_identifier, buyer_identifier, registration_date,
          registered_area_sqm, consideration_amount, registration_type, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'REGISTERED')
        RETURNING *`,
        [
          parcelId,
          documentNumber,
          seller,
          buyer,
          'ID-SELLER-VERIFIED',
          buyerIdNumber || 'ID-BUYER-VERIFIED',
          regDate,
          registeredAreaSqm,
          considerationAmount,
          deedType || 'SALE_DEED',
        ]
      );
      const registration = regRes.rows[0];

      // 2. Cryptographic audit log for SRO registration
      await auditService.logAction({
        entityType: 'REGISTRATION_DEED',
        entityId: registration.id,
        action: 'REGISTRATION_RECORDED',
        actorId: req.user!.email,
        payload: {
          document_number: documentNumber,
          parcel_id: parcelId,
          seller,
          buyer,
          registered_area_sqm: registeredAreaSqm,
          consideration_amount: considerationAmount,
        },
      });

      await client.query('COMMIT');

      // 3. Automatically trigger mutation application creation linked to this registration
      const mutationApp = await mutationService.submitApplication({
        parcelId,
        registrationId: registration.id,
        sellerName: seller,
        applicant: {
          name: buyer,
          id_number: buyerIdNumber || `ID-${buyer.replace(/\s+/g, '').toUpperCase().slice(0, 8)}`,
          phone: buyerPhone || '+91-9876500000',
          email: buyerEmail || `${buyer.toLowerCase().replace(/\s+/g, '')}@citizen.demo`,
          type: 'BUYER',
        },
        actorId: req.user!.email,
      });

      res.status(201).json({
        message: 'Registration detected — mutation application created.',
        data: {
          registration,
          mutation_application: mutationApp,
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  }
);

// GET /api/registrations/anomalies (Detect double registrations or area discrepancies)
router.get('/anomalies', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Detect duplicate registrations on same parcel in short timeframe
    const duplicateRes = await query(`
      SELECT r1.parcel_id, p.ulpin, p.village, p.mandal,
             r1.document_number AS doc_1, r1.registration_date AS date_1, r1.seller AS seller_1, r1.buyer AS buyer_1,
             r2.document_number AS doc_2, r2.registration_date AS date_2, r2.seller AS seller_2, r2.buyer AS buyer_2
      FROM registrations r1
      JOIN registrations r2 ON r1.parcel_id = r2.parcel_id AND r1.id != r2.id AND r1.registration_date <= r2.registration_date
      JOIN parcels p ON p.id = r1.parcel_id
      WHERE ABS(EXTRACT(EPOCH FROM (r2.registration_date - r1.registration_date)) / 86400) < 180
    `);

    // Detect area discrepancies where registered area > surveyed parcel area
    const areaMismatchRes = await query(`
      SELECT r.id, r.document_number, r.seller, r.buyer, r.registered_area_sqm,
             p.id AS parcel_id, p.ulpin, p.area_sqm AS surveyed_area_sqm,
             ROUND((r.registered_area_sqm - p.area_sqm)::numeric, 2) AS excess_area_sqm
      FROM registrations r
      JOIN parcels p ON p.id = r.parcel_id
      WHERE r.registered_area_sqm > (p.area_sqm * 1.05)
    `);

    res.json({
      data: {
        duplicate_registration_risks: duplicateRes.rows,
        area_mismatch_risks: areaMismatchRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

export const registrationsRouter = router;

