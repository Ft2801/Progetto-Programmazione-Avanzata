import { Router } from 'express';
import { registerValidation, loginValidation } from '../middleware/authMiddleware.js';
import * as authController from '../controllers/authController.js';
// Rotte di autenticazione: registrazione e login
const router = Router();
// Registrazione utente (producer o consumer)
router.post('/register', registerValidation, authController.register);
// Login utente: ritorna un JWT firmato
router.post('/login', loginValidation, authController.login);
export default router;
