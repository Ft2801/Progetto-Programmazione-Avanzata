import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { User } from '../models/User.js';
// Registrazione utente (producer o consumer)
export async function register(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { email, password, name, role } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing)
        return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const credit = role === 'consumer' ? 1000 : 0; // credito iniziale per i consumer
    const user = await User.create({ email, passwordHash, name, role, credit });
    return res.status(201).json({ id: user.id });
}
// Login utente: ritorna un JWT firmato
export async function login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET || 'please_change_me', { expiresIn: '2d' });
    return res.json({ token });
}
