import express, { Request, Response } from 'express';
import { AppError } from '../../middleware/errorHandler';
import {
  validateRequest,
  programPaginationValidation,
} from '../../middleware/validation';
import {
  getEngagementMetrics,
  getPlatformStats,
  getProgramStats,
  getAttributionAnalytics,
} from './analytics.service';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = express.Router();

/**
 * @swagger
 * /api/v1/analytics/engagement:
 *   get:
 *     summary: Get total engagement metrics
 *     description: Returns aggregated engagement data across all platforms and users
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Engagement metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AnalyticsEngagement'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/engagement',
  validateRequest,
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const data = await getEngagementMetrics();
      res.json({ data });
    } catch (error) {
      throw new AppError('Failed to retrieve engagement metrics', 500);
    }
  }),
);

/**
 * @swagger
 * /api/v1/analytics/platforms:
 *   get:
 *     summary: Get platform-wise statistics
 *     description: Returns engagement and performance metrics broken down by social media platform
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Platform statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlatformStats'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/platforms',
  validateRequest,
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const data = await getPlatformStats();
      res.json({ data });
    } catch (error) {
      throw new AppError('Failed to retrieve platform statistics', 500);
    }
  }),
);

/**
 * @swagger
 * /api/v1/analytics/programs:
 *   get:
 *     summary: Get program performance statistics with pagination
 *     description: Returns paginated performance metrics for each advocacy program with optional sorting
 *     tags:
 *       - Analytics
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: sort
 *         in: query
 *         description: Sort field for programs
 *         required: false
 *         schema:
 *           type: string
 *           enum: [totalEngagement, totalSales, userCount, programName]
 *           default: totalEngagement
 *       - name: order
 *         in: query
 *         description: Sort order
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Program statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProgramStats'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/programs',
  [...programPaginationValidation],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'totalEngagement',
        order = 'desc',
      } = req.query;
      const result = await getProgramStats(
        Number(page),
        Number(limit),
        sort as string,
        order as 'asc' | 'desc',
      );
      res.json(result);
    } catch (error) {
      throw new AppError('Failed to retrieve program statistics', 500);
    }
  }),
);

/**
 * @swagger
 * /api/v1/analytics/attribution:
 *   get:
 *     summary: Get sales attribution analytics
 *     description: Returns sales performance and attribution data across platforms
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Attribution analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AttributionAnalytics'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/attribution',
  validateRequest,
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const data = await getAttributionAnalytics();
      res.json({ data });
    } catch (error) {
      throw new AppError('Failed to retrieve attribution analytics', 500);
    }
  }),
);

export default router;
