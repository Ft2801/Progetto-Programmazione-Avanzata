import { Request, Response, NextFunction } from "express";
import {
  upsertProfileRules,
  upsertCapacitiesRules,
  occupancyRules,
  updatePricesRules,
  earningsRules,
  proportionalAcceptRules,
} from "../rules/producerRules.js";
import { validate } from "./validate.js";

/**
 * Validazione per aggiornare o inserire un profilo produttore
 */
export async function upsertProfileValidation(req: Request, res: Response, next: NextFunction) {
  for (const rule of upsertProfileRules) {
    await rule.run(req);
  }
  validate(req, res, next);
}

/**
 * Validazione per aggiornare o inserire le capacità di produzione
 */
export async function upsertCapacitiesValidation(req: Request, res: Response, next: NextFunction) {
  for (const rule of upsertCapacitiesRules) {
    await rule.run(req);
  }
  validate(req, res, next);
}

/**
 * Validazione per controllare l'occupazione (es. disponibilità risorse)
 */
export async function occupancyValidation(req: Request, res: Response, next: NextFunction) {
  for (const rule of occupancyRules) {
    await rule.run(req);
  }
  validate(req, res, next);
}

/**
 * Validazione per aggiornare i prezzi
 */
export async function updatePricesValidation(req: Request, res: Response, next: NextFunction) {
  for (const rule of updatePricesRules) {
    await rule.run(req);
  }
  validate(req, res, next);
}

/**
 * Validazione per controllare i guadagni
 */
export async function earningsValidation(req: Request, res: Response, next: NextFunction) {
  for (const rule of earningsRules) {
    await rule.run(req);
  }
  validate(req, res, next);
}

/**
 * Validazione per accettazione proporzionale
 */
export async function proportionalAcceptValidation(req: Request, res: Response, next: NextFunction) {
  for (const rule of proportionalAcceptRules) {
    await rule.run(req);
  }
  validate(req, res, next);
}

