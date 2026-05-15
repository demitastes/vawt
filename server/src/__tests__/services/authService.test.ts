import * as authService from '../../services/authService';
import * as jose from 'jose';
import config from '../../config';

// Mock the database entirely
const mockDb = {
  prepare: jest.fn().mockReturnThis(),
  run: jest.fn(),
  get: jest.fn(),
};

jest.mock('../../db/client', () => ({
  getDb: () => mockDb,
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new session and return a valid JWT', async () => {
      const userId = 1;

      const token = await authService.createSession(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify the JWT
      const secret = new TextEncoder().encode(config.JWT_SECRET);
      const verified = await jose.jwtVerify(token, secret);

      expect(verified.payload.sub).toBe(userId.toString());
      expect(verified.payload.sessionId).toBeDefined();
    });

    it('should call prepare with correct SQL', async () => {
      const userId = 1;
      mockDb.prepare.mockReturnValueOnce({ run: jest.fn() });

      await authService.createSession(userId);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        `INSERT INTO sessions (id, user_id, created_at, last_seen) VALUES (?, ?, ?, ?)`
      );
    });

    it('should insert session with correct parameters', async () => {
      const userId = 42;
      const mockRun = jest.fn();
      mockDb.prepare.mockReturnValueOnce({ run: mockRun });

      await authService.createSession(userId);

      expect(mockRun).toHaveBeenCalled();
      const args = mockRun.mock.calls[0];
      expect(args[1]).toBe(userId);
    });

    it('should set JWT expiry from config', async () => {
      const userId = 1;
      const token = await authService.createSession(userId);

      const secret = new TextEncoder().encode(config.JWT_SECRET);
      const verified = await jose.jwtVerify(token, secret);

      // Verify exp claim is set
      expect(verified.payload.exp).toBeDefined();
    });
  });

  describe('verifySession', () => {
    it('should return true for active session', () => {
      const userId = 1;
      const sessionId = 'session-123';

      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: sessionId,
          revoked_at: null,
        }),
      });

      const result = authService.verifySession(userId, sessionId);

      expect(result).toBe(true);
    });

    it('should return false for revoked session', () => {
      const userId = 1;
      const sessionId = 'session-123';

      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: sessionId,
          revoked_at: new Date().toISOString(),
        }),
      });

      const result = authService.verifySession(userId, sessionId);

      expect(result).toBe(false);
    });

    it('should return false for non-existent session', () => {
      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined),
      });

      const result = authService.verifySession(1, 'non-existent');

      expect(result).toBe(false);
    });
  });

  describe('revokeSession', () => {
    it('should update session with revoked_at timestamp', () => {
      const sessionId = 'session-123';
      const mockRun = jest.fn();
      mockDb.prepare.mockReturnValueOnce({ run: mockRun });

      authService.revokeSession(sessionId);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'UPDATE sessions SET revoked_at = ? WHERE id = ?'
      );
      expect(mockRun).toHaveBeenCalled();
      const args = mockRun.mock.calls[0];
      expect(args[1]).toBe(sessionId);
    });

    it('should use current timestamp for revocation', () => {
      const sessionId = 'session-123';
      const mockRun = jest.fn();
      mockDb.prepare.mockReturnValueOnce({ run: mockRun });

      const beforeRevoke = new Date();
      authService.revokeSession(sessionId);
      const afterRevoke = new Date();

      expect(mockRun).toHaveBeenCalled();
      const timestamp = mockRun.mock.calls[0][0];
      const revokedTime = new Date(timestamp);

      expect(revokedTime.getTime()).toBeGreaterThanOrEqual(beforeRevoke.getTime());
      expect(revokedTime.getTime()).toBeLessThanOrEqual(afterRevoke.getTime());
    });
  });
});
