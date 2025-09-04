import { body } from "express-validator";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
// Regole di validazione per la registrazione
export const registerRules = [
    body("email")
        .exists().withMessage("Email is required").bail()
        .isEmail().withMessage("Invalid email").bail()
        .custom(async (email) => {
        const existing = await User.findOne({ where: { email } });
        if (existing)
            throw new Error("Email already registered");
        return true;
    }),
    body("password")
        .exists().withMessage("Password is required").bail()
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("name")
        .exists().withMessage("Name is required").bail()
        .isString().notEmpty().withMessage("Name is required"),
    body("role")
        .exists().withMessage("Role is required").bail()
        .isIn(["producer", "consumer"]).withMessage("Role must be either 'producer' or 'consumer'"),
];
// Regole di validazione per il login
export const loginRules = [
    body("email")
        .exists().withMessage("Invalid credentials").bail()
        .isEmail().withMessage("Invalid credentials").bail()
        .custom(async (email, { req }) => {
        const user = await User.findOne({ where: { email } });
        if (!user)
            return Promise.reject("Invalid credentials");
        req.foundUser = user;
    }),
    body("password")
        .exists().withMessage("Invalid credentials").bail()
        .custom(async (password, { req }) => {
        const user = req.foundUser;
        if (user) {
            const ok = await bcrypt.compare(password, user.passwordHash);
            if (!ok)
                throw new Error("Invalid credentials");
        }
    }),
];
