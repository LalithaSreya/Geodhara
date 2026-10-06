import { Router, Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service.js';
import { requireAuth, requireRole, requirePermission } from '../../middleware/auth.js';

const router = Router();

// GET /api/audit/verify (Verify full cryptographic hash chain)
router.get('/verify', requireAuth, requirePermission('audit:verify'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await auditService.verifyChainIntegrity();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/audit (Global ledger list)
router.get('/', requireAuth, requirePermission('audit:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await auditService.getLedger(limit, offset);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/audit/:entity/:id/history
router.get('/:entity/:id/history', requireAuth, requirePermission('audit:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = await auditService.getAuditForEntity(req.params.entity, req.params.id);
    res.json({ data: entries });
  } catch (err) {
    next(err);
  }
});

// GET /api/audit/:entity/:id
router.get('/:entity/:id', requireAuth, requirePermission('audit:read'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = await auditService.getAuditForEntity(req.params.entity, req.params.id);
    res.json({ data: entries });
  } catch (err) {
    next(err);
  }
});

export const auditRouter = router;
