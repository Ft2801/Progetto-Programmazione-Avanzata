import { Request, Response, NextFunction } from "express";
import { registerRules, loginRules } from "../validation/authRules.js";
import { validate } from "./validate.js";

/**
 * Validazione registrazione utente
 */
export async function registerValidation(req: Request, res: Response, next: NextFunction) {
  for (const rule of registerRules) {
    // Esegue le regole SEQUENZIALMENTE per rispettare eventuali dipendenze d'ordine
    // (anche se nel registro non ci sono dipendenze, manteniamo coerenza)
    await rule.run(req);
  }
  validate(req, res, next);
}

/**
 * Validazione login utente
 */
export async function loginValidation(req: Request, res: Response, next: NextFunction) {
  // Importante: eseguire in sequenza, perché il validator della password
  // dipende da `foundUser` impostato dal validator dell'email
  for (const rule of loginRules) {
    await rule.run(req);
  }
  validate(req, res, next);
}
