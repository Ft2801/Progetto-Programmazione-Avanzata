import { validationResult } from "express-validator";
import { registerRules, loginRules } from "../validation/authRules.js";
import { StatusCodes } from 'http-status-codes';
export async function registerValidation(req, res, next) {
    for (const rule of registerRules) {
        // Esegue le regole SEQUENZIALMENTE per rispettare eventuali dipendenze d'ordine
        // (anche se nel registro non ci sono dipendenze, manteniamo coerenza)
        // eslint-disable-next-line no-await-in-loop
        await rule.run(req);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    next();
}
export async function loginValidation(req, res, next) {
    // Importante: eseguire in sequenza, perché il validator della password
    // dipende da `foundUser` impostato dal validator dell'email
    for (const rule of loginRules) {
        // eslint-disable-next-line no-await-in-loop
        await rule.run(req);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid credentials" });
    next();
}
