import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
// Registrazione utente
export async function register(req, res) {
    // Tolta perché le validazioni vengono fatte nel middleware e utilizzate nelle rotte
    /*const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });*/
    // Se arriva qui, vuol dire che le validazioni sono passate e i dati sono puliti
    const { email, password, name, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const credit = role === "consumer" ? 1000 : 0;
    const user = await User.create({ email, passwordHash, name, role, credit });
    return res.status(StatusCodes.CREATED).json({ id: user.id });
}
// Login utente
export async function login(req, res) {
    // qui puoi essere sicuro che email e password siano corrette
    const user = req.foundUser;
    if (!user)
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: getReasonPhrase(StatusCodes.UNAUTHORIZED) });
    const secret = process.env.JWT_SECRET;
    if (!secret)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Server misconfiguration: JWT secret not set' });
    const token = jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: "2d" });
    return res.json({ token });
}
