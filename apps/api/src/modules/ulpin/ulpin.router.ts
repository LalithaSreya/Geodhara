import { Router, Request, Response, NextFunction } from 'express';
import { ulpinService } from './ulpin.service.js';
import { validateRequest } from '../../middleware/validate.js';
import { ulpinParamSchema } from './ulpin.validator.js';
import { z } from 'zod';

const router = Router();

// Validate format & existence query
router.post(
  '/validate',
  validateRequest({
    body: z.object({
      ulpin: z.string().min(1, 'ULPIN is required'),
    }),
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ulpinService.checkUlpinStatus(req.body.ulpin);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Resolve parcel details by ULPIN
router.get(
  '/:ulpin',
  validateRequest({
    params: ulpinParamSchema,
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ulpinService.resolveUlpin(req.params.ulpin);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

export const ulpinRouter = router;
