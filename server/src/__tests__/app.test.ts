import request from 'supertest';
import { createApp } from '../app';

jest.mock('../db/client', () => ({
  getDb: () => ({
    prepare: jest.fn().mockReturnThis(),
    get: jest.fn(),
  }),
}));

describe('app', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CORS configuration', () => {
    it('should accept requests with valid origin', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(res.status).toBe(200);
    });
  });

  describe('404 handler', () => {
    it('should return 404 for undefined routes', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/api/nonexistent-route');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Not Found');
      expect(res.body).toHaveProperty('message');
    });

    it('should return 404 for root path', async () => {
      const app = createApp();
      const res = await request(app).get('/');

      expect(res.status).toBe(404);
    });
  });

  describe('error handling', () => {
    it('should return 404 for undefined routes', async () => {
      const app = createApp();
      const res = await request(app).get('/api/undefined-route-xyz');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('middleware', () => {
    it('should set security headers with helmet', async () => {
      const app = createApp();

      const res = await request(app).get('/api/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
    });
  });
});
