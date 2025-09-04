import { query } from "express-validator";

/** Regole per visualizzare le statistiche */
export const statsRules = [
  query('range').isString(),
  query('format').optional().isIn(['json', 'image', 'html']),
];
