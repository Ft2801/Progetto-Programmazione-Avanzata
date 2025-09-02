import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { User } from '../models/User.js';

// Registrazione utente (producer o consumer)
export async function register(req: Request, res: Response) {
  // Verifica errori di validazione input
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  // Estrae i dati richiesti dal body tipizzandoli
  const { email, password, name, role } = req.body as {
    email: string;
    password: string;
    name: string;
    role: 'producer' | 'consumer';
  };
  // Controlla unicità email
  const existing = await User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  // Crea hash sicuro della password
  const passwordHash = await bcrypt.hash(password, 10);
  // Imposta un credito iniziale per i consumer
  const credit = role === 'consumer' ? 1000 : 0; // credito iniziale per i consumer
  // Crea l'utente nel database
  const user = await User.create({ email, passwordHash, name, role, credit });
  return res.status(201).json({ id: user.id });
}

// Login utente: ritorna un JWT firmato
export async function login(req: Request, res: Response) {
  // Verifica errori di validazione input
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  // Estrae credenziali
  const { email, password } = req.body as { email: string; password: string };
  // Recupera utente per email
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  // Confronta password plaintext con hash salvato
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  // Genera JWT con payload minimo necessario e scadenza
  const token = jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET || 'please_change_me',
    { expiresIn: '2d' }
  );
  return res.json({ token });
}

