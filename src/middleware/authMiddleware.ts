import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { registerRules, loginRules } from "../validation/authRules.js";

export async function registerValidation(req: Request, res: Response, next: NextFunction) {
  await Promise.all(registerRules.map(rule => rule.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

export async function loginValidation(req: Request, res: Response, next: NextFunction) {
  await Promise.all(loginRules.map(rule => rule.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(401).json({ error: "Invalid credentials qwerty" });
  next();
}
