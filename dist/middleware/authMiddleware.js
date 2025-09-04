import { validationResult } from "express-validator";
import { registerRules, loginRules } from "../validation/authRules.js";
import { StatusCodes } from 'http-status-codes';
export async function registerValidation(req, res, next) {
    await Promise.all(registerRules.map(rule => rule.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    next();
}
export async function loginValidation(req, res, next) {
    await Promise.all(loginRules.map(rule => rule.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid credentials" });
    next();
}
