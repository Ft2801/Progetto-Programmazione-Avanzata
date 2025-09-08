import { Request, Response, NextFunction } from 'express';
import { StatusCodes, ReasonPhrases } from 'http-status-codes';
import jwt from 'jsonwebtoken';

/**
 * Struttura del payload JWT atteso nell'applicazione.
 *
 * campi principali:
 * - `sub`: id numerico dell'utente (subject)
 * - `role`: ruolo dell'utente (producer|consumer|admin)
 * - `name`, `email`: campi opzionali per comodità
 */
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

/*
 * Middleware di autenticazione JWT.
 *
 * - Verifica presenza dell'header `Authorization: Bearer ...`.
 * - Decodifica e valida il token con la `JWT_SECRET` e popola `req.user` con il payload tipizzato.
 * - In caso di token mancante/valido risponde con 401/500 a seconda del problema.
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Missing Authorization header' });
  }
  const token = header.substring('Bearer '.length);
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Server misconfiguration: JWT secret not set' });
    }
    const decoded = jwt.verify(token, secret);
  // Il decode può restituire vari tipi: normalizziamo in un oggetto parziale con possibile sub stringa
  const maybe = decoded as Partial<JwtPayload> & { sub?: number | string };
    if (!maybe || typeof maybe !== 'object' || maybe.sub == null || !maybe.role) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid token payload' });
    }
  // Accetta `sub` come numero o stringa numerica e lo normalizza a number
  const subNumber = typeof maybe.sub === 'number' ? maybe.sub : (/^\d+$/.test(String(maybe.sub)) ? Number(maybe.sub) : NaN);
    if (!Number.isFinite(subNumber)) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid token subject' });
    }
    req.user = { sub: subNumber, role: maybe.role, name: maybe.name, email: maybe.email } as JwtPayload;
    return next();
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid token' });
  }
}

/*
 * Middleware di autorizzazione basata sui ruoli.
 * Restituisce un handler che verifica che l'utente autenticato (`req.user`) abbia uno dei ruoli consentiti.
 */
export function requireRole(roles: Array<JwtPayload['role']>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(StatusCodes.UNAUTHORIZED).json({ error: ReasonPhrases.UNAUTHORIZED });
    if (!roles.includes(req.user.role)) return res.status(StatusCodes.FORBIDDEN).json({ error: ReasonPhrases.FORBIDDEN });
    return next();
  };
}

/*
 * Helper che combina autenticazione e autorizzazione per una rotta.
 * Uso: `router.get('/private', authWithRoles(['producer','admin']), handler)`
 */
export function authWithRoles(roles: Array<JwtPayload['role']>) {
  return [authenticate, requireRole(roles)];
}



