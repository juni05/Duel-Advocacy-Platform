import { z } from 'zod';
import { logger } from './logger';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000').transform(Number),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  MONGODB_URI: z.string().url(),
  DATA_DIR: z.string().default('./data'),
  BATCH_SIZE: z.string().default('1000').transform(Number),
  API_RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  API_RATE_LIMIT_MAX: z.string().default('100').transform(Number),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    logger.info('Environment variables validated successfully');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment validation failed:', {
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    throw new Error('Invalid environment configuration');
  }
}

export default validateEnv;
