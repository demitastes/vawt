import fs from 'fs';
import path from 'path';

// Use an in-memory database for tests
process.env.DATABASE_PATH = ':memory:';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-change-in-production-minimum-32-chars-required-!!';
process.env.SERVICE_KEY = 'test-service-key-minimum-32-chars-required-for-testing-!!';
process.env.MAGIC_LINK_BASE_URL = 'http://localhost:3000';
process.env.CORS_ORIGIN = 'http://localhost:5173';

// Suppress console output during tests
const originalError = console.error;
const originalLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
});

// Clean up any test artifacts
afterAll(() => {
  const testDbPath = path.join(__dirname, '../../test-db.sqlite');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('test setup', () => {
  it('should initialize test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_SECRET?.length).toBeGreaterThanOrEqual(32);
  });
});
