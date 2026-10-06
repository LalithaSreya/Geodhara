import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://geodhara_user:geodhara_secret_password@localhost:5432/geodhara_db'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('geodhara_sih_2026_super_secure_jwt_token_secret_key_99182'),
  CORS_ORIGIN: z.string().default('*'),
});

export const env = envSchema.parse(process.env);
