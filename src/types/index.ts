import { z } from 'zod';

// Social platform types
export const socialPlatformSchema = z.enum([
  'instagram',
  'facebook',
  'twitter',
  'tiktok',
  'youtube',
  'linkedin',
  'other',
]);
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;

// Social post schema (task_completed)
export const socialPostSchema = z.object({
  postId: z.string(),
  platform: socialPlatformSchema,
  url: z.string().url().optional(),
  likes: z.number().int().min(0).default(0),
  comments: z.number().int().min(0).default(0),
  shares: z.number().int().min(0).default(0),
  reach: z.number().int().min(0).default(0),
  engagement: z.number().min(0).default(0),
});

export type SocialPost = z.infer<typeof socialPostSchema>;

// Sales attribution schema (from total_sales_attributed)
export const salesAttributionSchema = z.object({
  programId: z.string(),
  amount: z.number().min(0),
});

export type SalesAttribution = z.infer<typeof salesAttributionSchema>;

// Program schema
export const programSchema = z.object({
  programId: z.string(),
  programName: z.string(),
});

export type Program = z.infer<typeof programSchema>;

// Social handle schema
export const socialHandleSchema = z.object({
  platform: socialPlatformSchema,
  handle: z.string(),
});

export type SocialHandle = z.infer<typeof socialHandleSchema>;

// User schema
export const userSchema = z.object({
  userId: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  socialHandles: z.array(socialHandleSchema).default([]),
  programs: z.array(programSchema).default([]),
  posts: z.array(socialPostSchema).default([]),
  salesAttributions: z.array(salesAttributionSchema).default([]),
  joinDate: z.coerce.date().optional(),
  totalEngagement: z.number().min(0).default(0),
  totalSales: z.number().min(0).default(0),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type User = z.infer<typeof userSchema>;

// ETL statistics
export type ETLStatistics = {
  totalFiles: number;
  processedFiles: number;
  successfulRecords: number;
  failedRecords: number;
  validationErrors: number;
  cleanRecords: number;
  messyRecords: number;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
};
