import type { SocialPlatform } from '../../../../types';

export type AggregationResult = {
  _id: string | null;
  totalEngagement?: number;
  totalLikes?: number;
  totalComments?: number;
  totalShares?: number;
  totalReach?: number;
  totalImpressions?: number;
  postCount?: number;
  averageEngagement?: number;
  platform?: SocialPlatform;
  totalSales?: number;
};

export type PlatformStatsResult = {
  platform: SocialPlatform;
  postCount: number;
  totalEngagement: number;
  totalReach: number;
  averageEngagement: number;
};

export type AttributionStatsResult = {
  totalSales: number;
  totalOrders: number;
};

// API response types for analytics
export type AnalyticsEngagementResponse = {
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  totalImpressions: number;
  averageEngagement: number;
  postCount: number;
};

export type AnalyticsPlatformResponse = {
  platform: SocialPlatform;
  postCount: number;
  totalEngagement: number;
  averageEngagement: number;
  totalReach: number;
  totalSales: number;
};

export type AnalyticsProgramResponse = {
  programId: string;
  programName: string;
  userCount: number;
  postCount: number;
  totalEngagement: number;
  totalSales: number;
  averageEngagementPerUser: number;
};

export type AnalyticsAttributionResponse = {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByPlatform: Array<{
    platform: SocialPlatform;
    sales: number;
    orders: number;
  }>;
};

export interface PlatformStats {
  platform: SocialPlatform;
  postCount: number;
  totalEngagement: number;
  totalSales: number;
}

export interface ProgramStats {
  programId: string;
  programName: string;
  userCount: number;
  totalEngagement: number;
  totalSales: number;
}

export interface AttributionResult extends AttributionStatsResult {
  averageOrderValue: number;
}

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
