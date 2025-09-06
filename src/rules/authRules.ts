import { body, ValidationChain } from "express-validator";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

// Regole di validazione per la registrazione
export const registerRules: ValidationChain[] = [
  body("email")
    .exists().withMessage(ReasonPhrases.BAD_REQUEST).bail()
    .isEmail().withMessage(ReasonPhrases.BAD_REQUEST).bail()
    .trim()
    .toLowerCase()
    .custom(async (email) => {
      const existing = await User.findOne({ where: { email } });
      if (existing) throw new Error(ReasonPhrases.CONFLICT);
      return true;
    }),
  body("password")
    .exists().withMessage(ReasonPhrases.BAD_REQUEST).bail()
    .isLength({ min: 6 }).withMessage(ReasonPhrases.BAD_REQUEST).bail()
    .trim(),
  body("name")
    .exists().withMessage(ReasonPhrases.BAD_REQUEST).bail()
    .isString().notEmpty().withMessage(ReasonPhrases.BAD_REQUEST).bail()
    .trim(),
  body("role")
    .exists().withMessage(ReasonPhrases.BAD_REQUEST).bail()
    .isIn(["producer", "consumer"]).withMessage(ReasonPhrases.BAD_REQUEST)
];

// Regole di validazione per il login
export const loginRules: ValidationChain[] = [
  body("email")
    .exists().withMessage(ReasonPhrases.UNAUTHORIZED).bail()
    .isEmail().withMessage(ReasonPhrases.UNAUTHORIZED).bail()
    .trim()
    .toLowerCase()
    .custom(async (email, { req }) => {
      const user = await User.findOne({ where: { email } });
      if (!user) throw new Error(ReasonPhrases.UNAUTHORIZED);
      (req as any).foundUser = user;
      return true;
    }),
  body("password")
    .exists().withMessage(ReasonPhrases.UNAUTHORIZED).bail()
    .trim()
    .custom(async (password, { req }) => {
      const user = (req as any).foundUser;
      if (!user) throw new Error(ReasonPhrases.UNAUTHORIZED);
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw new Error(ReasonPhrases.UNAUTHORIZED);
      return true;
    }),
];