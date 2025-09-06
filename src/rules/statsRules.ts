import { query } from "express-validator";
import { ReasonPhrases } from 'http-status-codes';

/** Regole per visualizzare le statistiche */
export const statsRules = [
  query('range').isString().withMessage(ReasonPhrases.BAD_REQUEST),
  query('format').optional().isIn(['json', 'image', 'html']).withMessage(ReasonPhrases.BAD_REQUEST),
];
