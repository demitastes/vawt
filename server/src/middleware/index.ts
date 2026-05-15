/**
 * Middleware exports.
 * Import individual middleware functions as needed:
 *
 * import { requireAuth, optionalAuth } from './middleware';
 * import { errorHandler } from './middleware';
 * import { validate } from './middleware';
 * import { requireServiceKey } from './middleware';
 */

export { errorHandler, AppError } from './errorHandler';
export { requireAuth, optionalAuth, type AuthUser } from './auth';
export { validate } from './validate';
export { requireServiceKey } from './requireServiceKey';
