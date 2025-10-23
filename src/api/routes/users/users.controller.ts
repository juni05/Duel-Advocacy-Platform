import express, { Request, Response } from 'express';
import { query } from 'express-validator';
import { AppError } from '../../middleware/errorHandler';
import {
  validateRequest,
  paginationValidation,
  userIdValidation,
  programFilterValidation,
  platformFilterValidation,
  engagementFilterValidation,
  salesFilterValidation,
} from '../../middleware/validation';
import {
  getUsers,
  getUserById,
  getTopUsers,
  getUserPosts,
} from './users.service';
import { asyncHandler } from '../../../utils/asyncHandler';

const router = express.Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List users with pagination and filtering
 *     description: Returns a paginated list of users with optional filtering by program, platform, engagement, and sales
 *     tags:
 *       - Users
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: programId
 *         in: query
 *         description: Filter by program ID
 *         required: false
 *         schema:
 *           type: string
 *       - name: platform
 *         in: query
 *         description: Filter by social media platform
 *         required: false
 *         schema:
 *           type: string
 *           enum: [twitter, facebook, instagram, linkedin, tiktok, youtube]
 *       - name: minEngagement
 *         in: query
 *         description: Minimum engagement score filter
 *         required: false
 *         schema:
 *           type: number
 *           minimum: 0
 *       - name: minSales
 *         in: query
 *         description: Minimum sales amount filter
 *         required: false
 *         schema:
 *           type: number
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  [
    ...paginationValidation,
    ...programFilterValidation,
    ...platformFilterValidation,
    ...engagementFilterValidation,
    ...salesFilterValidation,
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, ...filters } = req.query;
    const result = await getUsers(Number(page), Number(limit), filters);
    res.json(result);
  }),
);

/**
 * @swagger
 * /api/v1/users/top:
 *   get:
 *     summary: Get top advocates by engagement
 *     description: Returns the top users ranked by their engagement scores
 *     tags:
 *       - Users
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Number of top users to return (1-50)
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Top users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/top',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
      .toInt(),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const users = await getTopUsers(limit);
    res.json({ data: users });
  }),
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user details
 *     description: Returns detailed information for a specific user
 *     tags:
 *       - Users
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdParam'
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id',
  [...userIdValidation],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ data: user });
  }),
);

/**
 * @swagger
 * /api/v1/users/{id}/posts:
 *   get:
 *     summary: Get user's posts
 *     description: Returns paginated list of posts for a specific user with optional platform filtering
 *     tags:
 *       - Users
 *     parameters:
 *       - $ref: '#/components/parameters/UserIdParam'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: platform
 *         in: query
 *         description: Filter posts by social media platform
 *         required: false
 *         schema:
 *           type: string
 *           enum: [twitter, facebook, instagram, linkedin, tiktok, youtube]
 *     responses:
 *       200:
 *         description: User posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:id/posts',
  [...userIdValidation, ...paginationValidation, ...platformFilterValidation],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 10, platform } = req.query;

    const response = await getUserPosts(
      id,
      platform as string,
      Number(page),
      Number(limit),
    );

    if (!response) {
      throw new AppError('User not found', 404);
    }

    res.json(response);
  }),
);

export default router;
