import { Request, Response } from 'express';
import { requireAuth, optionalAuth } from '../../middleware/auth';
import * as jose from 'jose';
import config from '../../config';

// Mock the database
const mockDb = {
  prepare: jest.fn().mockReturnThis(),
  get: jest.fn(),
};

jest.mock('../../db/client', () => ({
  getDb: () => mockDb,
}));

async function createMockJWT(userId: number = 1): Promise<string> {
  const secret = new TextEncoder().encode(config.JWT_SECRET);
  const token = await new jose.SignJWT({
    sub: userId.toString(),
    sessionId: 'mock-session-id',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
  return token;
}

describe('auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should attach user to request when valid token is provided', async () => {
      const userId = 1;
      const token = await createMockJWT(userId);

      // Mock database to return a valid user and non-revoked session
      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 'mock-session-id',
          revoked_at: null,
        }),
      });

      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: userId,
          email: 'test@example.com',
          discord_id: null,
        }),
      });

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe(userId);
      expect(next).toHaveBeenCalledWith();
    });

    it('should call next() without error on valid token', async () => {
      const token = await createMockJWT(1);

      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 'mock-session-id',
          revoked_at: null,
        }),
      });

      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 1,
          email: 'test@example.com',
          discord_id: null,
        }),
      });

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should call next with error when token is missing', async () => {
      const req = {
        headers: {},
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(401);
    });

    it('should call next with error when bearer token is invalid format', async () => {
      const req = {
        headers: {
          authorization: 'InvalidToken',
        },
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });

    it('should call next with error when token is malformed', async () => {
      const req = {
        headers: {
          authorization: 'Bearer malformed.token',
        },
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(401);
    });

    it('should call next with error when session is revoked', async () => {
      const token = await createMockJWT(1);

      // Mock database to return a revoked session
      const revokedAt = new Date().toISOString();
      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 'mock-session-id',
          revoked_at: revokedAt,
        }),
      });

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(401);
    });
  });

  describe('optionalAuth', () => {
    it('should attach user when valid token is provided', async () => {
      const userId = 1;
      const token = await createMockJWT(userId);

      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 'mock-session-id',
          revoked_at: null,
        }),
      });

      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: userId,
          email: 'test@example.com',
          discord_id: null,
        }),
      });

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user?.id).toBe(userId);
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user when token is missing', async () => {
      const req = {
        headers: {},
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user when token is invalid', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid.token',
        },
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it('should continue without user when session is revoked', async () => {
      const token = await createMockJWT(1);

      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 'mock-session-id',
          revoked_at: new Date().toISOString(),
        }),
      });

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as unknown as Request;

      const res = {} as Response;
      const next = jest.fn();

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

  });
});
