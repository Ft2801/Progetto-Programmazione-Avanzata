import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Struttura del payload JWT atteso nell'applicazione
export interface JwtPayload {
  sub: number; // id utente (subject)
  role: 'producer' | 'consumer' | 'admin';
  name?: string;
  email?: string;
}

// Estensione del tipo Request di Express per includere l'utente autenticato
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Middleware di autenticazione JWT: valida il token Bearer e popola req.user
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  const token = header.substring('Bearer '.length);
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server misconfiguration: JWT secret not set' });
    }
    const decoded = jwt.verify(token, secret);
    const maybe = decoded as Partial<JwtPayload> & { sub?: number | string };
    if (!maybe || typeof maybe !== 'object' || maybe.sub == null || !maybe.role) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    // Accetta sub come numero o stringa numerica
    const subNumber = typeof maybe.sub === 'number' ? maybe.sub : (/^\d+$/.test(String(maybe.sub)) ? Number(maybe.sub) : NaN);
    if (!Number.isFinite(subNumber)) {
      return res.status(401).json({ error: 'Invalid token subject' });
    }
    req.user = { sub: subNumber, role: maybe.role, name: maybe.name, email: maybe.email } as JwtPayload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Autorizzazione basata su ruolo: consente l'accesso solo ai ruoli specificati
export function requireRole(roles: Array<JwtPayload['role']>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
}


