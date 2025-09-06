import { body, query } from "express-validator";
import { ReasonPhrases } from 'http-status-codes';

/** Regole per prenotare uno slot */
export const reserveRules = [
  body("producerId").isInt({ min: 1 }).withMessage(ReasonPhrases.BAD_REQUEST),
  body("date").isISO8601().withMessage(ReasonPhrases.BAD_REQUEST),
  body("hour").isInt({ min: 0, max: 23 }).withMessage(ReasonPhrases.BAD_REQUEST),
  body("kwh").isFloat({ min: 0.1 }).withMessage(ReasonPhrases.BAD_REQUEST),
];

/** Regole per modificare o cancellare una prenotazione */
export const modifyRules = [
  body("reservationId").isInt({ min: 1 }).withMessage(ReasonPhrases.BAD_REQUEST),
  body("kwh").isFloat({ min: 0 }).withMessage(ReasonPhrases.BAD_REQUEST),
];

/** Regole per elencare gli acquisti */
export const purchasesRules = [
  query("producerId").optional().isInt({ min: 1 }).withMessage(ReasonPhrases.BAD_REQUEST),
  query("energyType").optional().isIn(["Fossile", "Eolico", "Fotovoltaico"]).withMessage(ReasonPhrases.BAD_REQUEST),
  query("range").optional().isString().withMessage(ReasonPhrases.BAD_REQUEST),
];

/** Regole per calcolare le emissioni di carbonio */
export const carbonRules = [
  query("range").isString().withMessage(ReasonPhrases.BAD_REQUEST),
];
