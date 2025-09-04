import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as producerController from '../controllers/producerController.js';
import {
  upsertProfileValidation,
  upsertCapacitiesValidation,
  occupancyValidation,
  updatePricesValidation,
  earningsValidation,
  proportionalAcceptValidation,
} from '../middleware/producerMiddleware.js';

// Rotte lato produttore: profilo, capacità, prezzi, occupazione, ricavi e accettazione proporzionale
const router = Router();

// Crea o aggiorna il profilo del produttore
router.post(
  '/profile',
  authenticate,
  requireRole(['producer', 'admin']),
  upsertProfileValidation,
  producerController.upsertProfile
);

// Imposta/aggiorna capacità per uno o più slot orari in una data
router.post(
  '/capacities',
  authenticate,
  requireRole(['producer', 'admin']),
  upsertCapacitiesValidation,
  producerController.upsertCapacities
);

// Occupazione per un produttore in un intervallo orario per una certa data
router.get(
  '/occupancy',
  authenticate,
  requireRole(['producer', 'admin']),
  occupancyValidation,
  producerController.occupancy
);

// Aggiorna i prezzi per uno o più slot orari in una data
router.post(
  '/prices',
  authenticate,
  requireRole(['producer', 'admin']),
  updatePricesValidation,
  producerController.updatePrices
);

// Ricavi totali in un intervallo di date
router.get(
  '/earnings',
  authenticate,
  requireRole(['producer', 'admin']),
  earningsValidation,
  producerController.earnings
);

// Taglio proporzionale in caso di overbooking: riduce le quantità e rimborsa l'eccesso
router.post(
  '/proportional-accept',
  authenticate,
  requireRole(['producer', 'admin']),
  proportionalAcceptValidation,
  producerController.proportionalAccept
);

export default router;
