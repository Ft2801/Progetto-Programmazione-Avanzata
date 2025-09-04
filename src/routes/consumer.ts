import { Router } from 'express';
import { authWithRoles } from '../middleware/auth.js';
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
  authWithRoles(['consumer', 'admin']),
  reserveValidation,
  consumerController.reserve
);

// Modifica prenotazione (inclusa cancellazione con kwh=0). Rimborso se >24h prima.
router.post(
  '/modify',
  authWithRoles(['consumer', 'admin']),
  modifyValidation,
  consumerController.modify
);

// Elenco acquisti con filtri
router.get(
  '/purchases',
  authWithRoles(['consumer', 'admin']),
  purchasesValidation,
  consumerController.purchases
);

// Calcolo dell'impronta di carbonio in un intervallo di tempo
router.get(
  '/carbon',
  authWithRoles(['consumer', 'admin']),
  carbonValidation,
  consumerController.carbon
);

export default router;
