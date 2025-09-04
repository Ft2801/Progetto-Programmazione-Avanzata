import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from 'http-status-codes';

export function validate(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
  }
  next();
}
