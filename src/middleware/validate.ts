import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from 'http-status-codes';

export function validate(req: Request, res: Response, next: NextFunction) {
  // Recupera gli errori della validazione (se presenti)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Restituisce gli errori in forma strutturata e termina la catena dei middleware
    return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
  }
  // Nessun errore: prosegui con il prossimo handler
  next();
}
