import { config } from 'dotenv';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

config({ path: '.env.test' });

jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));