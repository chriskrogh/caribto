import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

// Middleware to automatically send 442 response with errors on failed validation
const validate = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(422).json({ errors: errors.array() });
};

export default validate;
