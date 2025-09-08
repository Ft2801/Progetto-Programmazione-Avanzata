import { authenticate } from '../middleware/auth.js';
import authRoutes from './auth.js';
import producerRoutes from './producer.js';
import consumerRoutes from './consumer.js';
import statsRoutes from './stats.js';

import { Router, Request, Response } from 'express';
import { User } from '../models/User.js';
import { StatusCodes, ReasonPhrases } from 'http-status-codes';

// Router principale che compone le sottorotte del dominio
const router = Router();

// Restituisce le informazioni dell'utente autenticato
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Rotta di prova per vedere tutti gli utenti (solo per test, da rimuovere in produzione)
router.get('/utenti', async (_req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'role', 'credit'], // scegli i campi da restituire
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ReasonPhrases.INTERNAL_SERVER_ERROR });
  }
});

// Monta le aree funzionali
router.use('/auth', authRoutes);
router.use('/producer', producerRoutes);
router.use('/consumer', consumerRoutes);
router.use('/stats', statsRoutes);

export default router;
