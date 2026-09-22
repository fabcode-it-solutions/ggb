import { Request, Response, NextFunction } from "express";
import { verifyCsrfToken } from "../utils/jwt.util";
import { AppError } from "./errorHandler";

export const validateCsrf = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get CSRF token from header
    const csrfToken = req.headers["x-csrf-token"] as string;
    
    if (!csrfToken) {
      throw new AppError("CSRF token required", 403);
    }

    // Verify CSRF token
    const isValid = verifyCsrfToken(csrfToken);
    if (!isValid) {
      throw new AppError("Invalid CSRF token", 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};