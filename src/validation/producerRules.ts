// src/validation/producerRules.ts
import { body, query } from "express-validator";

// Regole di validazione per la creazione o aggiornamento del profilo del produttore
export const upsertProfileRules = [
  body("energyType").isIn(["Fossile", "Eolico", "Fotovoltaico"]),
  body("co2PerKwh").isFloat({ min: 0 }),
  body("pricePerKwh").optional().isFloat({ min: 0 }),
  body("defaultMaxPerHourKwh").isFloat({ min: 0 }),
];

// Regole di validazione per impostare o aggiornare la capacità per slot orari in una data
export const upsertCapacitiesRules = [
  body("date").isISO8601().toDate(),
  body("slots").isArray({ min: 1 }),
  body("slots.*.hour").isInt({ min: 0, max: 23 }),
  body("slots.*.maxCapacityKwh").isFloat({ min: 0 }),
  body("slots.*.pricePerKwh").optional().isFloat({ min: 0 }),
];

// Regole di validazione per ottenere l’occupazione del produttore in un intervallo orario
export const occupancyRules = [
  query("date").isISO8601(),
  query("fromHour").optional().isInt({ min: 0, max: 23 }),
  query("toHour").optional().isInt({ min: 0, max: 23 }),
];

// Regole di validazione per aggiornare i prezzi in uno o più slot orari in una data
export const updatePricesRules = [
  body("date").isISO8601(),
  body("slots").isArray({ min: 1 }),
  body("slots.*.hour").isInt({ min: 0, max: 23 }),
  body("slots.*.pricePerKwh").isFloat({ min: 0 }),
];

// Regole di validazione per ottenere i ricavi totali in un intervallo di date
export const earningsRules = [
  query("range").isString(),
];

// Regole di validazione per il taglio proporzionale in caso di overbooking
export const proportionalAcceptRules = [
  body("date").isISO8601(),
  body("hour").isInt({ min: 0, max: 23 }),
];
