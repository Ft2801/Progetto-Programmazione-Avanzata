import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as consumerController from '../controllers/consumerController.js';
import { 
  reserveValidation, 
  modifyValidation, 
  purchasesValidation, 
  carbonValidation 
} from '../middleware/consumerMiddleware.js';

// Rotte lato consumer: prenotazioni, modifica/cancellazione, storico ed emissioni
const router = Router();

// Prenota uno slot orario per il giorno successivo (min 0.1 kWh);
// vincolo: un solo produttore per ora per consumatore
router.post(
  '/reserve',
  authenticate,
  requireRole(['consumer', 'admin']),
  reserveValidation,
  consumerController.reserve
);

// Modifica prenotazione (inclusa cancellazione con kwh=0). Rimborso se >24h prima.
router.post(
  '/modify',
  authenticate,
  requireRole(['consumer', 'admin']),
  modifyValidation,
  consumerController.modify
);

// Elenco acquisti con filtri
router.get(
  '/purchases',
  authenticate,
  requireRole(['consumer', 'admin']),
  purchasesValidation,
  consumerController.purchases
);

// Calcolo dell'impronta di carbonio in un intervallo di tempo
router.get(
  '/carbon',
  authenticate,
  requireRole(['consumer', 'admin']),
  carbonValidation,
  consumerController.carbon
);

export default router;
