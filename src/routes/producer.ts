import { Router } from 'express';
import { authWithRoles } from '../middleware/auth.js';
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
  authWithRoles(['producer', 'admin']),
  upsertProfileValidation,
  producerController.upsertProfile
);

// Imposta/aggiorna capacità per uno o più slot orari in una data
router.post(
  '/capacities',
  authWithRoles(['producer', 'admin']),
  upsertCapacitiesValidation,
  producerController.upsertCapacities
);

// Occupazione per un produttore in un intervallo orario per una certa data
router.get(
  '/occupancy',
  authWithRoles(['producer', 'admin']),
  occupancyValidation,
  producerController.occupancy
);

// Aggiorna i prezzi per uno o più slot orari in una data
router.post(
  '/prices',
  authWithRoles(['producer', 'admin']),
  updatePricesValidation,
  producerController.updatePrices
);

// Ricavi totali in un intervallo di date
router.get(
  '/earnings',
  authWithRoles(['producer', 'admin']),
  earningsValidation,
  producerController.earnings
);

// Taglio proporzionale in caso di overbooking: riduce le quantità e rimborsa l'eccesso
router.post(
  '/proportional-accept',
  authWithRoles(['producer', 'admin']),
  proportionalAcceptValidation,
  producerController.proportionalAccept
);

export default router;
