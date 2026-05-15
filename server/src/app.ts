import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from './config';
import apiRouter from './routes';

class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Create and configure the Express application
 * This factory function allows the app to be tested without listening
 */
export function createApp(): Express {
  const app = express();

  /**
   * Security and parsing middleware
   */
  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());

  /**
   * API routes (all mounted under /api)
   */
  app.use('/api', apiRouter);

  /**
   * 404 handler
   */
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `${req.method} ${req.path} not found`,
    });
  });

  /**
   * Global error handler
   */
  app.use(
    (
      err: Error | AppError,
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      console.error('Error:', err);

      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          error: err.code,
          message: err.message,
          ...(err.details && { details: err.details }),
        });
        return;
      }

      // Generic error response
      res.status(500).json({
        error: 'Internal Server Error',
        message: config.NODE_ENV === 'development' ? err.message : 'An error occurred',
      });
    }
  );

  return app;
}

export { AppError };
