import request from 'supertest';
import { createApp } from '../../app';

jest.mock('../../db/client', () => ({
  getDb: () => ({
    prepare: jest.fn().mockReturnThis(),
    get: jest.fn(),
  }),
}));

describe('health routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return 200 with status ok', async () => {
      const res = await request(createApp())
        .get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });

    it('should return timestamp', async () => {
      const beforeReq = new Date();
      const res = await request(createApp())
        .get('/api/health');
      const afterReq = new Date();

      expect(res.body).toHaveProperty('timestamp');
      const timestamp = new Date(res.body.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeReq.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterReq.getTime());
    });

  });
});
