import { z } from 'zod';
import { logger } from './logging.js';

const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number).pipe(z.number().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BALLDONTLIE_API_KEY: z.string().optional(),
  ESPNNBAL_API_KEY: z.string().optional(),
  DATABASE_PATH: z.string().default('./data/predictions.db'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string().default('priv8sus-dev-secret-change-in-production'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ID_YEARLY: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedConfig: EnvConfig | null = null;

export function validateEnv(): EnvConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const rawEnv = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    BALLDONTLIE_API_KEY: process.env.BALLDONTLIE_API_KEY,
    ESPNNBAL_API_KEY: process.env.ESPNNBAL_API_KEY,
    DATABASE_PATH: process.env.DATABASE_PATH,
    LOG_LEVEL: process.env.LOG_LEVEL,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    JWT_SECRET: process.env.JWT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID_MONTHLY: process.env.STRIPE_PRICE_ID_MONTHLY,
    STRIPE_PRICE_ID_YEARLY: process.env.STRIPE_PRICE_ID_YEARLY,
    FRONTEND_URL: process.env.FRONTEND_URL,
  };

  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    logger.error(`Environment validation failed: ${errors}`);
    throw new Error(`Invalid environment configuration: ${errors}`);
  }

  cachedConfig = result.data;
  logger.info('Environment validation passed', { env: cachedConfig.NODE_ENV });
  return cachedConfig;
}