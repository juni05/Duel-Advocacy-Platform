import { UserModel } from '../../../models/User';
import type { SocialPost, User } from '../../../types';
import type { PaginatedResponse, UserFilterQuery } from './types/user';

/**
 * Get paginated list of users with optional filtering
 */
export async function getUsers(
  page: number = 1,
  limit: number = 10,
  filters: UserFilterQuery = {},
): Promise<PaginatedResponse<User>> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100); // 100 is the maximum limit
  const skip = (safePage - 1) * safeLimit;

  type MongoFilter = Record<string, any>;
  const filter: MongoFilter = {};

  if (filters.programId) {
    filter.programs = { $elemMatch: { programId: filters.programId } };
  }

  if (filters.platform) {
    filter.posts = { $elemMatch: { platform: filters.platform } };
  }

  if (filters.minEngagement !== undefined) {
    filter.totalEngagement = { $gte: filters.minEngagement };
  }

  if (filters.minSales !== undefined) {
    filter.totalSales = { $gte: filters.minSales };
  }

  type MongoSort = Record<string, 1 | -1>;
  const sort: MongoSort = {};
  if (filters.sort) {
    sort[filters.sort] = filters.order === 'desc' ? -1 : 1;
  } else {
    sort.createdAt = -1; // Default sort
  }

  // Execute query
  const [users, total] = await Promise.all([
    UserModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean(),
    UserModel.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / safeLimit);

  return {
    data: users as User[],
    pagination: {
      page,
      limit: safeLimit,
      total,
      totalPages,
    },
  };
}

/**
 * Get a single user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const user = await UserModel.findOne({ userId }).select('-__v').lean();

  return user as User | null;
}

/**
 * Get top advocates by engagement
 */
export async function getTopUsers(limit: number = 10): Promise<User[]> {
  const users = await UserModel.find({})
    .sort({ totalEngagement: -1 })
    .limit(limit)
    .select('-__v')
    .lean();

  return users as User[];
}

/**
 * Get user's posts with optional filtering
 */
export async function getUserPosts(
  userId: string,
  platform?: string,
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedResponse<SocialPost> | null> {
  const user = await UserModel.findOne({ userId }).select('posts');
  if (!user) {
    return null;
  }
  const skip = (page - 1) * limit;

  const matchStage: any = { userId };

  const pipeline: any[] = [{ $match: matchStage }, { $unwind: '$posts' }];

  if (platform) {
    pipeline.push({ $match: { 'posts.platform': platform } });
  }

  pipeline.push(
    { $sort: { 'posts.engagement': -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          { $replaceRoot: { newRoot: '$posts' } },
        ],
        total: [{ $count: 'count' }],
      },
    },
  );

  const result = await UserModel.aggregate(pipeline);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const total = result[0]?.total?.[0]?.count || 0;

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    data: result[0]?.data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
