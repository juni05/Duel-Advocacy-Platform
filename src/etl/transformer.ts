import type {
  User,
  SocialHandle,
  SocialPost,
  SalesAttribution,
  Program,
} from '../types';
import { logger } from '../utils/logger';

/**
 * Normalize social media handle by removing @ symbol and converting to lowercase
 */
function normalizeSocialHandle(handle: string): string {
  return handle.replace(/^@+/, '').toLowerCase().trim();
}

/**
 * Parse timestamp from various formats
 */
function parseTimestamp(
  value: string | number | Date | undefined,
): Date | undefined {
  if (!value) return undefined;

  if (value instanceof Date) return value;

  if (typeof value === 'number') {
    // Handle both seconds and milliseconds timestamps
    const timestamp = value > 10000000000 ? value : value * 1000;
    return new Date(timestamp);
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return undefined;
}

/**
 * Calculate total engagement from post data
 */
function calculateEngagement(post: Partial<SocialPost>): number {
  const likes = post.likes || 0;
  const comments = post.comments || 0;
  const shares = post.shares || 0;
  return likes + comments + shares;
}

/**
 * Transform social handles
 */
function transformSocialHandles(handles?: unknown[]): SocialHandle[] {
  if (!Array.isArray(handles) || handles.length === 0) return [];

  return handles
    .filter(
      (h): h is Record<string, unknown> => typeof h === 'object' && h !== null,
    )
    .map((handle) => {
      const rawHandle = handle.handle as string | undefined;

      return {
        platform: handle.platform as SocialHandle['platform'],
        handle: rawHandle ? normalizeSocialHandle(rawHandle) : '', // Keep handle as-is from data
      };
    })
    .filter((h) => h.handle && h.platform);
}

/**
 * Transform social posts
 */
function transformSocialPosts(posts?: unknown[]): SocialPost[] {
  if (!Array.isArray(posts) || posts.length === 0) return [];

  return posts
    .filter(
      (p): p is Record<string, unknown> => typeof p === 'object' && p !== null,
    )
    .map((post) => {
      const taskId = post.task_id as string | null | undefined;
      const platform = post.platform as string | null | undefined;
      const postUrl = post.post_url as string | null | undefined;

      // Generate ID if missing, null, or empty
      const finalTaskId =
        taskId && taskId !== null && taskId.trim() !== ''
          ? taskId
          : `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Handle invalid number values like "NaN", "no-data", etc.
      const safeLikes = Number(post.likes);
      const safeComments = Number(post.comments);
      const safeShares = Number(post.shares);
      const safeReach = Number(post.reach);

      const transformed: SocialPost = {
        postId: finalTaskId,
        platform:
          platform && platform !== null
            ? (platform as SocialPost['platform'])
            : 'other',
        url:
          postUrl && postUrl !== null && postUrl.trim() !== ''
            ? postUrl
            : undefined,
        likes: isNaN(safeLikes) ? 0 : safeLikes,
        comments: isNaN(safeComments) ? 0 : safeComments,
        shares: isNaN(safeShares) ? 0 : safeShares,
        reach: isNaN(safeReach) ? 0 : safeReach,
        engagement: 0,
      };

      // Calculate engagement
      transformed.engagement = calculateEngagement(transformed);

      return transformed;
    })
    .filter((p) => p.postId && p.platform);
}

/**
 * Create sales attribution from program
 */
function createSalesAttribution(
  programId: string,
  amount: number,
): SalesAttribution {
  return {
    programId,
    amount,
  };
}

/**
 * Transform programs
 */
function transformPrograms(programs?: unknown[] | null): Program[] {
  if (!programs || !Array.isArray(programs) || programs.length === 0) return [];

  return programs
    .filter(
      (p): p is Record<string, unknown> => typeof p === 'object' && p !== null,
    )
    .map((program) => {
      const programId = program.program_id as string | null | undefined;
      const brand = program.brand as string | number | null | undefined;

      // Generate ID if missing, null, or empty string
      const finalProgramId =
        programId && programId !== null && programId.trim() !== ''
          ? programId
          : `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Convert brand to string, handle numbers and invalid values
      const finalBrand =
        brand && brand !== null ? String(brand) : 'Unknown Program';

      return {
        programId: finalProgramId,
        programName: finalBrand,
      };
    })
    .filter(
      (p) =>
        p.programId && p.programName && p.programName !== 'Unknown Program',
    );
}

/**
 * Main transformation function for user data
 */
export function transformUser(rawData: Record<string, unknown>): User {
  // Generate user ID if missing or null
  const rawUserId = rawData.user_id as string | null | undefined;
  const userId =
    rawUserId && rawUserId !== null && rawUserId.trim() !== ''
      ? rawUserId
      : `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const name = (rawData.name as string | null | undefined) || undefined;
  const email = (rawData.email as string | null | undefined) || undefined;
  const joinedAt = rawData.joined_at as
    | string
    | number
    | Date
    | null
    | undefined;
  const joinDate = parseTimestamp(joinedAt ?? undefined);

  // Build social handles from direct fields (skip nulls)
  const directHandles: unknown[] = [];
  const instagramHandle = rawData.instagram_handle as string | null | undefined;
  const tiktokHandle = rawData.tiktok_handle as string | null | undefined;

  if (instagramHandle && instagramHandle !== null) {
    directHandles.push({ platform: 'instagram', handle: instagramHandle });
  }
  if (tiktokHandle && tiktokHandle !== null) {
    directHandles.push({ platform: 'tiktok', handle: tiktokHandle });
  }

  const socialHandles = transformSocialHandles(directHandles);

  // Extract posts and sales from advocacy_programs
  const advocacyPrograms = rawData.advocacy_programs as
    | unknown[]
    | null
    | undefined;
  let allPosts: unknown[] = [];
  const salesAttributions: SalesAttribution[] = [];

  if (advocacyPrograms && Array.isArray(advocacyPrograms)) {
    advocacyPrograms.forEach((program) => {
      if (typeof program === 'object' && program !== null) {
        const prog = program as Record<string, unknown>;
        // Extract tasks as posts
        const tasksCompleted = prog.tasks_completed as
          | unknown[]
          | null
          | undefined;
        if (tasksCompleted && Array.isArray(tasksCompleted)) {
          allPosts = [...allPosts, ...tasksCompleted];
        }
        // Extract sales attribution
        const programId = prog.program_id as string | null | undefined;
        const rawSales = prog.total_sales_attributed;
        const salesAmount = Number(rawSales);

        // Only add sales if we have a valid program ID and valid sales amount
        if (
          programId &&
          programId !== null &&
          programId.trim() !== '' &&
          !isNaN(salesAmount) &&
          salesAmount > 0
        ) {
          salesAttributions.push(
            createSalesAttribution(programId, salesAmount),
          );
        }
      }
    });
  }

  const posts = transformSocialPosts(allPosts);
  const programs = transformPrograms(advocacyPrograms);

  // Calculate aggregates
  const totalEngagement = posts.reduce((sum, post) => sum + post.engagement, 0);
  const totalSales = salesAttributions.reduce(
    (sum, sale) => sum + sale.amount,
    0,
  );

  const transformed: User = {
    userId,
    name,
    email,
    socialHandles,
    programs,
    posts,
    salesAttributions,
    joinDate,
    totalEngagement,
    totalSales,
  };

  return transformed;
}

/**
 * Transform batch of users
 */
export function transformUserBatch(
  rawDataArray: Record<string, unknown>[],
): User[] {
  const transformed: User[] = [];

  for (const rawData of rawDataArray) {
    try {
      const user = transformUser(rawData);
      transformed.push(user);
    } catch (error) {
      logger.error('Error transforming user:', {
        userId: rawData.userId,
        error,
      });
    }
  }

  return transformed;
}

export default { transformUser, transformUserBatch };
