import crypto from 'crypto';
import { timingSafeEqual as nodeTimingSafeEqual } from 'crypto';

/**
 * Generate random bytes and return as base64url string.
 *
 * @param size - Number of random bytes to generate (e.g., 32 for 256-bit)
 * @returns Base64url-encoded random string
 */
export function randomBytes(size: number = 32): string {
  return crypto.randomBytes(size).toString('base64url');
}

/**
 * Generate a UUID v4 string.
 */
export function uuidv4(): string {
  return crypto.randomUUID();
}

/**
 * SHA-256 hash of a string. Returns hex string.
 *
 * @param data - String to hash
 * @returns Hex-encoded SHA-256 hash
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Constant-time string comparison.
 * Prevents timing attacks when comparing secrets.
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  try {
    const aBuffer = Buffer.from(a, 'utf8');
    const bBuffer = Buffer.from(b, 'utf8');
    return nodeTimingSafeEqual(aBuffer, bBuffer);
  } catch {
    return false;
  }
}
