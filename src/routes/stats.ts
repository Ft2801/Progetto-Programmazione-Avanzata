import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as statsController from '../controllers/statsController.js';
import { statsValidation } from '../middleware/statsMiddleware.js';

// Rotte statistiche per i produttori
const router = Router();

// Statistiche orarie: min%, max%, media%, dev. standard% in un intervallo
router.get(
  '/producer',
  authenticate,
  requireRole(['producer', 'admin']),
  statsValidation,
  statsController.producerStats
);

export default router;