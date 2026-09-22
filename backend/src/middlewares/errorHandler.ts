import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.util";
import logger from "../utils/logger.util";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  logger.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // Custom AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    return sendError(res, errors, 400);
  }

  // Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return sendError(
        res,
        "A record with this unique field already exists",
        409
      );
    }
    if (err.code === "P2025") {
      return sendError(res, "Record not found", 404);
    }
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token", 401);
  }
  if (err.name === "TokenExpiredError") {
    return sendError(res, "Token expired", 401);
  }

  // Default error
  return sendError(res, "Internal server error", 500);
};
