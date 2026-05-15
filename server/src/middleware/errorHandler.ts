import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for application-specific errors with status codes.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handler middleware.
 * Must be added as the last middleware in the Express app.
 *
 * Catches errors and formats them as JSON responses with appropriate status codes.
 * Logs errors to console for debugging.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error to console for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    code: err instanceof AppError ? err.code : undefined,
    details: err instanceof AppError ? err.details : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: Record<string, unknown> | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }

  const errorResponse: Record<string, unknown> = {
    error: {
      code,
      message,
    },
  };

  if (details) {
    errorResponse.error = {
      ...(errorResponse.error as Record<string, unknown>),
      details,
    };
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    (errorResponse.error as Record<string, unknown>).stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};
