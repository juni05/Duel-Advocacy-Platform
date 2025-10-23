import { UserModel } from '../../../models/User';
import { ProgramModel } from '../../../models/Program';
import type {
  AggregationResult,
  PlatformStats,
  ProgramStats,
  AttributionResult,
  PaginatedResponse,
} from './types/analytic';
import { cache } from '../../../utils/cache';

/**
 * Get total engagement metrics across all users
 */
export async function getEngagementMetrics(): Promise<AggregationResult> {
  const cached = cache.get<AggregationResult>('engagement-metrics');
  if (cached) return cached;

  const result = await UserModel.aggregate<AggregationResult>([
    { $unwind: '$posts' },
    {
      $group: {
        _id: null,
        totalEngagement: { $sum: '$posts.engagement' },
        totalLikes: { $sum: '$posts.likes' },
        totalComments: { $sum: '$posts.comments' },
        totalShares: { $sum: '$posts.shares' },
        totalReach: { $sum: '$posts.reach' },
        totalImpressions: { $sum: '$posts.impressions' },
        postCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalEngagement: 1,
        totalLikes: 1,
        totalComments: 1,
        totalShares: 1,
        totalReach: 1,
        totalImpressions: 1,
        postCount: 1,
      },
    },
  ]);

  const data = result[0] || {
    totalEngagement: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalReach: 0,
    totalImpressions: 0,
    postCount: 0,
  };

  cache.set('engagement-metrics', data);
  return data;
}

/**
 * Get platform-wise breakdown of engagement and sales
 */
export async function getPlatformStats(): Promise<PlatformStats[]> {
  const cached = cache.get<PlatformStats[]>('platform-stats');
  if (cached) return cached;

  // Aggregation for post metrics by platform
  const result = await UserModel.aggregate<PlatformStats>([
    { $unwind: '$posts' },
    {
      $group: {
        _id: '$posts.platform',
        postCount: { $sum: 1 },
        totalEngagement: { $sum: '$posts.engagement' },
        totalLikes: { $sum: '$posts.likes' },
        totalComments: { $sum: '$posts.comments' },
        totalShares: { $sum: '$posts.shares' },
        totalReach: { $sum: '$posts.reach' },
      },
    },
    {
      $project: {
        _id: 0,
        platform: '$_id',
        postCount: 1,
        totalEngagement: 1,
        totalSales: { $literal: 0 },
      },
    },
    { $sort: { totalEngagement: -1 } },
  ]);

  cache.set('platform-stats', result);
  return result;
}
/**
 * Get program performance statistics with pagination
 */
export async function getProgramStats(
  page: number = 1,
  limit: number = 10,
  sort: string = 'totalEngagement',
  order: 'asc' | 'desc' = 'desc',
): Promise<PaginatedResponse<ProgramStats>> {
  const cacheKey = `program-stats-${page}-${limit}-${sort}-${order}`;
  const cached = cache.get<PaginatedResponse<ProgramStats>>(cacheKey);
  if (cached) return cached;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100); // 100 is the maximum limit
  const skip = (safePage - 1) * safeLimit;

  const validSortFields = [
    'totalEngagement',
    'totalSales',
    'userCount',
    'programName',
  ];
  const sortField = validSortFields.includes(sort) ? sort : 'totalEngagement';
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [sortField]: sortOrder };

  const [programs, total] = await Promise.all([
    ProgramModel.find({})
      .select('programId programName userCount totalEngagement totalSales')
      .sort(sortObj)
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    ProgramModel.countDocuments({}),
  ]);

  const data = programs.map((program) => ({
    programId: program.programId,
    programName: program.programName,
    userCount: program.userCount || 0,
    totalEngagement: program.totalEngagement || 0,
    totalSales: program.totalSales || 0,
  }));

  const totalPages = Math.ceil(total / safeLimit);

  const result: PaginatedResponse<ProgramStats> = {
    data,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
    },
  };

  cache.set(cacheKey, result);
  return result;
}

/**
 * Get sales attribution analytics
 */
export async function getAttributionAnalytics(): Promise<AttributionResult> {
  const cached = cache.get<AttributionResult>('attribution-analytics');
  if (cached) return cached;
  const result = await UserModel.aggregate<AttributionResult>([
    { $unwind: '$salesAttributions' },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$salesAttributions.amount' },
        totalOrders: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalSales: 1,
        totalOrders: 1,
        averageOrderValue: { $divide: ['$totalSales', '$totalOrders'] },
      },
    },
  ]);

  const data = result[0] || {
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
  };

  cache.set('attribution-analytics', data);
  return data;
}
