import request from 'supertest';
import * as jose from 'jose';
import config from '../../config';
import { createApp } from '../../app';

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

// Mock the database
const mockDb = {
  prepare: jest.fn().mockReturnThis(),
  run: jest.fn(),
  get: jest.fn(),
};

jest.mock('../../db/client', () => ({
  getDb: () => mockDb,
}));

jest.mock('../../services/magicLinkService', () => ({
  generateMagicLink: jest.fn(() => 'test-magic-token'),
  verifyMagicLink: jest.fn(async () => 'test-jwt-token'),
  sendMagicLinkEmail: jest.fn(async () => {}),
}));

jest.mock('../../services/discordOAuthService', () => ({
  generateAuthUrl: jest.fn(() => ({
    url: 'https://discord.com/oauth/authorize?client_id=test',
    state: 'test-state',
  })),
  exchangeCode: jest.fn(async () => 'test-access-token'),
  fetchDiscordUser: jest.fn(async () => ({
    id: 'discord-123',
    username: 'testuser',
  })),
  upsertUser: jest.fn((discordUser) => ({
    id: 1,
    email: null,
    discord_id: discordUser.id,
    discord_username: discordUser.username,
  })),
  linkDiscordToEmail: jest.fn(),
}));

describe('auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/magic-link/request', () => {
    it('should accept valid email and return 200', async () => {
      const res = await request(createApp())
        .post('/api/auth/magic-link/request')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 200 for non-existent email (for security)', async () => {
      const res = await request(createApp())
        .post('/api/auth/magic-link/request')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(200);
    });

    it('should reject invalid email', async () => {
      const res = await request(createApp())
        .post('/api/auth/magic-link/request')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing email', async () => {
      const res = await request(createApp())
        .post('/api/auth/magic-link/request')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/magic-link/verify', () => {
    it('should accept valid token and return JWT', async () => {
      const mockMagicLinkService = require('../../services/magicLinkService');
      mockMagicLinkService.verifyMagicLink.mockResolvedValue('valid-jwt-token');

      const res = await request(createApp())
        .get('/api/auth/magic-link/verify?token=test-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 when token is missing', async () => {
      const res = await request(createApp())
        .get('/api/auth/magic-link/verify');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/auth/discord/authorize', () => {
    it('should return authorization URL', async () => {
      const res = await request(createApp())
        .get('/api/auth/discord/authorize');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('authorize_url');
      expect(res.body.authorize_url).toContain('discord.com');
    });

    it('should require authentication when link=true', async () => {
      const res = await request(createApp())
        .get('/api/auth/discord/authorize?link=true');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('NOT_AUTHENTICATED');
    });

    it('should allow linking when authenticated', async () => {
      const userId = 1;
      const token = await createMockJWT(userId);

      // Mock database for auth verification
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

      const res = await request(createApp())
        .get('/api/auth/discord/authorize?link=true')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('authorize_url');
    });
  });

  describe('GET /api/auth/discord/callback', () => {
    it('should return 400 when code is missing', async () => {
      const res = await request(createApp())
        .get('/api/auth/discord/callback?state=test');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_CODE');
    });

    it('should return 400 when state is missing', async () => {
      const res = await request(createApp())
        .get('/api/auth/discord/callback?code=test');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_STATE');
    });

    it('should upsert Discord user and return JWT', async () => {
      const mockDiscordService = require('../../services/discordOAuthService');
      mockDiscordService.upsertUser.mockReturnValue({
        id: 1,
        discord_id: 'discord-123',
      });

      const res = await request(createApp())
        .get('/api/auth/discord/callback?code=test-code&state=test-state');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should link Discord to existing user when state contains user ID', async () => {
      const userId = 1;
      const mockDiscordService = require('../../services/discordOAuthService');

      // Encode user ID in state
      const stateData = JSON.stringify({ pending_link_for_user_id: userId });
      const state = Buffer.from(stateData).toString('base64url');

      mockDiscordService.linkDiscordToEmail.mockReturnValue(undefined);

      // Mock database to find the user
      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: userId,
        }),
      });

      const res = await request(createApp())
        .get(`/api/auth/discord/callback?code=test-code&state=${state}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(createApp())
        .post('/api/auth/logout');

      expect(res.status).toBe(401);
    });

    it('should revoke session and return 200', async () => {
      const userId = 1;
      const token = await createMockJWT(userId);

      // Mock database for auth verification
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

      // Mock the UPDATE for revoke
      mockDb.prepare.mockReturnValueOnce({
        run: jest.fn(),
      });

      const res = await request(createApp())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(createApp())
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should return user profile when authenticated', async () => {
      const userId = 1;
      const token = await createMockJWT(userId);

      // Mock database for auth verification
      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 'mock-session-id',
          revoked_at: null,
        }),
      });

      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: userId,
          email: 'user@example.com',
          discord_id: null,
        }),
      });

      // Mock the SELECT for /me
      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: userId,
          email: 'user@example.com',
          discord_id: null,
          discord_username: null,
          display_name: null,
          is_admin: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });

      const res = await request(createApp())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(userId);
      expect(res.body.email).toBe('user@example.com');
      expect(res.body).toHaveProperty('created_at');
      expect(res.body).toHaveProperty('updated_at');
    });

    it('should return is_admin as boolean', async () => {
      const userId = 2;
      const token = await createMockJWT(userId);

      // Mock database for auth verification
      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 'mock-session-id',
          revoked_at: null,
        }),
      });

      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: userId,
          email: 'admin@example.com',
          discord_id: null,
        }),
      });

      // Mock the SELECT for /me
      mockDb.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: userId,
          email: 'admin@example.com',
          discord_id: null,
          discord_username: null,
          display_name: null,
          is_admin: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });

      const res = await request(createApp())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.is_admin).toBe(true);
    });
  });
});
