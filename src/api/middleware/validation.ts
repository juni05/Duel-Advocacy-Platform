import type { Request, Response, NextFunction } from 'express';
import { validationResult, query, param } from 'express-validator';
import { AppError } from './errorHandler';

export function validateRequest(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map(
        (err) => `${err.type === 'field' ? err.path : 'unknown'}: ${err.msg}`,
      )
      .join(', ');

    throw new AppError(`Validation failed: ${errorMessages}`, 400);
  }

  next();
}

// Common validation rules
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sort')
    .optional()
    .isString()
    .isIn(['totalEngagement', 'totalSales', 'createdAt', 'lastActivityDate'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
];

export const userIdValidation = [
  param('id').notEmpty().withMessage('User ID is required').isString(),
];

export const programFilterValidation = [
  query('programId')
    .optional()
    .isString()
    .withMessage('Program ID must be a string'),
];

export const platformFilterValidation = [
  query('platform')
    .optional()
    .isIn([
      'instagram',
      'facebook',
      'twitter',
      'tiktok',
      'youtube',
      'linkedin',
      'other',
    ])
    .withMessage('Invalid platform'),
];

export const engagementFilterValidation = [
  query('minEngagement')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min engagement must be a positive integer')
    .toInt(),
];

export const salesFilterValidation = [
  query('minSales')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min sales must be a positive number')
    .toFloat(),
];

export const programPaginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sort')
    .optional()
    .isString()
    .isIn(['totalEngagement', 'totalSales', 'userCount', 'programName'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
];

export default {
  validateRequest,
  paginationValidation,
  programPaginationValidation,
  userIdValidation,
  programFilterValidation,
  platformFilterValidation,
  engagementFilterValidation,
  salesFilterValidation,
};
