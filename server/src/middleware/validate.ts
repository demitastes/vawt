import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler';

/**
 * Attach validated data to request object.
 */
declare global {
  namespace Express {
    interface Request {
      validatedData?: Record<string, unknown>;
    }
  }
}

/**
 * Higher-order function that returns a validation middleware.
 * Can validate body, query, or params.
 *
 * @param source - What to validate: 'body', 'query', or 'params'
 * @param schema - Zod schema to validate against
 * @returns Express middleware that validates the specified part
 *
 * @example
 * app.post('/users', validateRequest('body', userSchema), handler);
 * app.get('/users', validateRequest('query', querySchema), handler);
 *
 * In the handler:
 * const data = req.body; // Already validated data is in the source
 */
export const validateRequest = (
  source: 'body' | 'query' | 'params',
  schema: ZodSchema
) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dataToValidate = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validated = schema.parse(dataToValidate);

      // Update the request with validated data
      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        req.query = validated as any;
      } else if (source === 'params') {
        req.params = validated as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        const appError = new AppError(
          400,
          'VALIDATION_ERROR',
          `${source} validation failed`,
          { errors: details }
        );

        next(appError);
      } else {
        next(error);
      }
    }
  };
};

/**
 * Backward-compatible validate function (validates body by default).
 */
export const validate = (schema: ZodSchema) => {
  return validateRequest('body', schema);
};
