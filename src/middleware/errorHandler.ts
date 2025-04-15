import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

// Base application error
export class AppError extends Error {
  constructor(public statusCode: number, public message: string, public code?: string) {
    super(message);
    this.name = "AppError";
  }
}

// Validation errors
export class ValidationError extends Error {
  code: string;

  constructor(message: string, code = "VALIDATION_ERROR") {
    super(message);
    this.name = "ValidationError";
    this.code = code;
  }
}

// Database errors
export class DatabaseError extends Error {
  code: string;

  constructor(message: string, code = "DATABASE_ERROR") {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
  }
}

// Not found errors
export class NotFoundError extends AppError {
  constructor(message: string, code: string = "NOT_FOUND") {
    super(404, message, code);
    this.name = "NotFoundError";
  }
}

// Authentication errors
export class AuthenticationError extends AppError {
  constructor(message: string, code: string = "AUTHENTICATION_ERROR") {
    super(401, message, code);
    this.name = "AuthenticationError";
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error with correlation ID if available
  const correlationId = req.headers["x-correlation-id"] as string;
  const sessionId = req.body?.session_id || req.query?.session_id || req.headers["x-session-id"];

  logger.error("Application error", {
    correlationId,
    sessionId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: (err as any).code,
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
    },
  });

  // Determine status code based on error type
  let statusCode = 500;
  if (err instanceof ValidationError) {
    statusCode = 400;
  } else if (err instanceof DatabaseError) {
    statusCode = 500;
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      code: (err as any).code || "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected error occurred",
    },
  });
};
