import express, { Request, Response } from 'express';
import { isConnected } from '../../utils/db';
import { asyncHandler } from '../../utils/asyncHandler';

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and its dependencies
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API is healthy and operational
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    const dbStatus = isConnected() ? 'connected' : 'disconnected';
    const uptime = process.uptime();

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)}s`,
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
    });
  }),
);
export default router;
