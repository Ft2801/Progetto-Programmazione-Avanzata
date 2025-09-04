import { Request, Response, NextFunction } from "express";
import { statsRules } from "../validation/statsRules.js";
import { validate } from "./validate.js";

/**
 * Validazione per visualizzare le statistiche
 */
export async function statsValidation(req: Request, res: Response, next: NextFunction) {
  for (const rule of statsRules) {
    await rule.run(req);
  }
  validate(req, res, next);
}