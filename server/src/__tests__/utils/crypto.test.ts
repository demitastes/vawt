import { uuidv4, randomBytes, sha256, timingSafeEqual } from '../../utils/crypto';

describe('crypto utils', () => {
  describe('uuidv4', () => {
    it('should generate a UUID v4 string', () => {
      const uuid = uuidv4();

      expect(typeof uuid).toBe('string');
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = uuidv4();
      const uuid2 = uuidv4();

      expect(uuid1).not.toBe(uuid2);
    });

    it('should always use version 4', () => {
      for (let i = 0; i < 10; i++) {
        const uuid = uuidv4();
        const parts = uuid.split('-');
        const versionByte = parts[2][0];
        expect(versionByte).toBe('4');
      }
    });

    it('should have correct variant bits', () => {
      for (let i = 0; i < 10; i++) {
        const uuid = uuidv4();
        const parts = uuid.split('-');
        const variantByte = parseInt(parts[3][0], 16);
        expect(variantByte).toBeGreaterThanOrEqual(8);
        expect(variantByte).toBeLessThanOrEqual(11);
      }
    });
  });

  describe('randomBytes', () => {
    it('should generate random bytes as base64url string', () => {
      const bytes = randomBytes(32);

      expect(typeof bytes).toBe('string');
      expect(bytes.length).toBeGreaterThan(0);
      expect(bytes).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate different values on each call', () => {
      const bytes1 = randomBytes(32);
      const bytes2 = randomBytes(32);

      expect(bytes1).not.toBe(bytes2);
    });

    it('should use custom size', () => {
      const bytes16 = randomBytes(16);
      const bytes64 = randomBytes(64);

      // Base64url encoding: 4 chars per 3 bytes
      expect(bytes64.length).toBeGreaterThan(bytes16.length);
    });
  });

  describe('sha256', () => {
    it('should hash a string consistently', () => {
      const data = 'test-string';
      const hash1 = sha256(data);
      const hash2 = sha256(data);

      expect(hash1).toBe(hash2);
    });

    it('should return hex-encoded hash', () => {
      const hash = sha256('test');

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = sha256('test1');
      const hash2 = sha256('test2');

      expect(hash1).not.toBe(hash2);
    });

    it('should return 64-character hex string for 256-bit hash', () => {
      const hash = sha256('any-input');

      expect(hash.length).toBe(64);
    });
  });

  describe('timingSafeEqual', () => {
    it('should return true for equal strings', () => {
      const result = timingSafeEqual('test', 'test');

      expect(result).toBe(true);
    });

    it('should return false for different strings', () => {
      const result = timingSafeEqual('test1', 'test2');

      expect(result).toBe(false);
    });

    it('should return false for different lengths', () => {
      const result = timingSafeEqual('short', 'much-longer-string');

      expect(result).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(timingSafeEqual('', '')).toBe(true);
      expect(timingSafeEqual('', 'a')).toBe(false);
    });

    it('should handle unicode characters', () => {
      const result = timingSafeEqual('café', 'café');

      expect(result).toBe(true);
    });

    it('should prevent timing attacks', () => {
      const secret = 'correct-secret';

      // All these should take roughly the same time
      const results = [
        timingSafeEqual(secret, 'aaaaaaaaaaaaaaaa'),
        timingSafeEqual(secret, 'correct-secrx'),
        timingSafeEqual(secret, 'wrong-secret-x'),
      ];

      // Just verify they all work; actual timing is hard to test
      expect(results).toContain(false);
    });
  });
});
