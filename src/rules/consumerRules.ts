import { body, query } from "express-validator";

/** Regole per prenotare uno slot */
export const reserveRules = [
  body("producerId").isInt({ min: 1 }),
  body("date").isISO8601(),
  body("hour").isInt({ min: 0, max: 23 }),
  body("kwh").isFloat({ min: 0.1 }),
];

/** Regole per modificare o cancellare una prenotazione */
export const modifyRules = [
  body("reservationId").isInt({ min: 1 }),
  body("kwh").isFloat({ min: 0 }),
];

/** Regole per elencare gli acquisti */
export const purchasesRules = [
  query("producerId").optional().isInt({ min: 1 }),
  query("energyType").optional().isIn(["Fossile", "Eolico", "Fotovoltaico"]),
  query("range").optional().isString(),
];

/** Regole per calcolare le emissioni di carbonio */
export const carbonRules = [
  query("range").isString(),
];
