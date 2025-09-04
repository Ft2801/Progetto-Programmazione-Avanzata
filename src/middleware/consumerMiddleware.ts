import { Request, Response, NextFunction } from "express";
import { reserveRules, modifyRules, purchasesRules, carbonRules } from "../validation/consumerRules.js";
import { validate } from "./validate.js";

/** Middleware per la validazione della prenotazione */
export async function reserveValidation(req: Request, res: Response, next: NextFunction) {
  for (const rule of reserveRules) await rule.run(req);
  validate(req, res, next);
}

/** Middleware per la validazione della modifica/cancellazione */
export async function modifyValidation(req: Request, res: Response, next: NextFunction) {
  for (const rule of modifyRules) await rule.run(req);
  validate(req, res, next);
}

/** Middleware per la validazione dell'elenco acquisti */
export async function purchasesValidation(req: Request, res: Response, next: NextFunction) {
  for (const rule of purchasesRules) await rule.run(req);
  validate(req, res, next);
}

/** Middleware per la validazione del calcolo carbonio */
export async function carbonValidation(req: Request, res: Response, next: NextFunction) {
  for (const rule of carbonRules) await rule.run(req);
  validate(req, res, next);
}
