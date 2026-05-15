import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from server directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_PATH: z.string().default('./vawt.db'),
  DATA_DIR: z.string().default('../data'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRY: z.string().default('30d'),
  MAGIC_LINK_BASE_URL: z.string().url(),
  MAGIC_LINK_EXPIRY_MINUTES: z.coerce.number().int().positive().default(15),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@vawt.app'),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  DISCORD_REDIRECT_URI: z.string().url().optional(),
  SERVICE_KEY: z.string().min(32, 'SERVICE_KEY must be at least 32 characters'),
  INITIAL_ADMIN_EMAIL: z.string().email().optional(),
});

type Config = z.infer<typeof envSchema>;

let config: Config;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const formattedErrors = error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');
    console.error('Invalid environment variables:\n', formattedErrors);
    process.exit(1);
  }
  throw error;
}

export default config;
