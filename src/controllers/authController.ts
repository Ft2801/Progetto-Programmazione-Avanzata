import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { User } from "../models/User.js";

// Registrazione utente
export async function register(req: Request, res: Response) {
  // Tolta perché le validazioni vengono fatte nel middleware e utilizzate nelle rotte
  /*const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });*/
  // Se arriva qui, vuol dire che le validazioni sono passate e i dati sono puliti

  const { email, password, name, role } = req.body as {
    email: string;
    password: string;
    name: string;
    role: "producer" | "consumer";
  };

  const passwordHash = await bcrypt.hash(password, 10);
  const credit = role === "consumer" ? 1000 : 0;

  const user = await User.create({ email, passwordHash, name, role, credit });
  return res.status(201).json({ id: user.id });
}

// Login utente
export async function login(req: Request, res: Response) {
  // qui puoi essere sicuro che email e password siano corrette
  const user = (req as any).foundUser;

  // Faccio questo controllo perché il controllo della password nel middleware non funziona (non so il motivo)
  const { password } = req.body as { password: string };
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials 1' });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "Server misconfiguration: JWT secret not set" });

  const token = jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: "2d" });
  return res.json({ token });
}