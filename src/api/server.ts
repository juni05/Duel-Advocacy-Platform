// src/api/server.ts
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { connectDB } from '../utils/db';
import { logger } from '../utils/logger';
import { validateEnv } from '../utils/env';
import { setupSwagger } from '../utils/swagger';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimit';
import healthRouter from './routes/health';
import usersRouter from './routes/users/users.controller';
import analyticsRouter from './routes/analytics/analytics.controller';

const app = express();

// Only validate env in non-test environments
const env =
  process.env.NODE_ENV !== 'test'
    ? validateEnv()
    : {
        NODE_ENV: 'test',
        PORT: 3001,
        MONGODB_URI: 'mongodb://localhost:27017/test',
      };

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Swagger documentation (skip in test)
if (process.env.NODE_ENV !== 'test') {
  setupSwagger(app);
}

// Health routes (no rate limiting)
app.use('/api', healthRouter);

// API routes with rate limiting (skip rate limit in test)
if (process.env.NODE_ENV === 'test') {
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/analytics', analyticsRouter);
} else {
  app.use('/api/v1/users', apiLimiter, usersRouter);
  app.use('/api/v1/analytics', apiLimiter, analyticsRouter);
}

// Serve static files from frontend build (skip in test)
if (process.env.NODE_ENV !== 'test') {
  const frontendPath = path.join(__dirname, '../../frontend');
  app.use(express.static(frontendPath));

  // Serve index.html for any non-API routes (SPA fallback)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      notFoundHandler(req, res);
    }
  });
} else {
  // 404 handler for tests
  app.use(notFoundHandler);
}

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Start listening
    const port = env.PORT;
    app.listen(port, () => {
      logger.info(`Server started successfully`, {
        port,
        environment: env.NODE_ENV,
      });
      logger.info(`Server running on http://localhost:${port}`);
      logger.info(`API Documentation: http://localhost:${port}/api-docs`);
      logger.info(`Health check: http://localhost:${port}/api/health`);
      logger.info(`Users API: http://localhost:${port}/api/v1/users`);
      logger.info(`Analytics API: http://localhost:${port}/api/v1/analytics`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors (skip in test)
if (process.env.NODE_ENV !== 'test') {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', { reason, promise });
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
  });
}

// Start the server ONLY if this file is run directly (not in tests)
if (require.main === module) {
  void startServer();
}

export default app;
