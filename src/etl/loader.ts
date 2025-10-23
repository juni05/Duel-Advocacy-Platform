/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UserModel } from '../models/User';
import { ProgramModel } from '../models/Program';
import type { User } from '../types';
import { logger } from '../utils/logger';

export type LoadOptions = {
  batchSize?: number;
  upsert?: boolean;
};

export type LoadResult = {
  inserted: number;
  updated: number;
  failed: number;
  errors: Array<{ userId: string; error: string }>;
};

/**
 * Load a single user into MongoDB
 */
export async function loadUser(user: User, upsert = true): Promise<boolean> {
  try {
    if (upsert) {
      await UserModel.findOneAndUpdate({ userId: user.userId }, user, {
        upsert: true,
        new: true,
      });
    } else {
      await UserModel.create(user);
    }

    return true;
  } catch (error) {
    logger.error('Error loading user:', { userId: user.userId, error });
    return false;
  }
}

/**
 * Load batch of users into MongoDB using bulk operations
 */
export async function loadUserBatch(
  users: User[],
  options: LoadOptions = {},
): Promise<LoadResult> {
  const { batchSize = 1000, upsert = true } = options;
  const result: LoadResult = {
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  if (users.length === 0) {
    return result;
  }

  // Process in batches for memory efficiency
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);

    try {
      if (upsert) {
        const bulkOps = batch.map((user) => ({
          updateOne: {
            filter: { userId: user.userId },
            update: { $set: user },
            upsert: true,
          },
        }));

        const bulkResult = await UserModel.bulkWrite(bulkOps, {
          ordered: false,
        });
        result.inserted += bulkResult.upsertedCount || 0;
        result.updated += bulkResult.modifiedCount || 0;
      } else {
        const insertResult = await UserModel.insertMany(batch, {
          ordered: false,
        });
        result.inserted += insertResult.length;
      }

      logger.info(`Loaded batch of ${batch.length} users`, {
        batchNumber: Math.floor(i / batchSize) + 1,
        totalBatches: Math.ceil(users.length / batchSize),
      });
    } catch (error) {
      result.failed += batch.length;

      // Log individual errors if available
      if (error && typeof error === 'object' && 'writeErrors' in error) {
        const writeErrors = (
          error as { writeErrors: Array<{ err: { op: User } }> }
        ).writeErrors;
        writeErrors.forEach((err) => {
          result.errors.push({
            userId: err.err.op.userId,
            error: JSON.stringify(err),
          });
        });
      } else {
        logger.error('Batch load error:', { batchSize: batch.length, error });
        batch.forEach((user) => {
          result.errors.push({
            userId: user.userId,
            error: String(error),
          });
        });
      }
    }
  }

  return result;
}

/**
 * Update program statistics based on loaded users
 */
export async function updateProgramStats(): Promise<void> {
  try {
    // Aggregate program statistics from users
    const programStats = await UserModel.aggregate([
      { $unwind: '$programs' },
      {
        $group: {
          _id: '$programs.programId',
          programName: { $first: '$programs.programName' },
          userCount: { $sum: 1 },
          totalEngagement: { $sum: '$totalEngagement' },
          totalSales: { $sum: '$totalSales' },
        },
      },
    ]);

    // Update or create program documents
    const bulkOps = programStats.map((stat) => ({
      updateOne: {
        filter: { programId: stat._id },
        update: {
          $set: {
            programId: stat._id,
            programName: stat.programName,
            userCount: stat.userCount,
            totalEngagement: stat.totalEngagement,
            totalSales: stat.totalSales,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await ProgramModel.bulkWrite(bulkOps);
      logger.info(`Updated statistics for ${bulkOps.length} programs`);
    }
  } catch (error) {
    logger.error('Error updating program stats:', error);
    throw error;
  }
}

/**
 * Clean/reset database collections
 */
export async function cleanDatabase(): Promise<void> {
  try {
    await Promise.all([UserModel.deleteMany({}), ProgramModel.deleteMany({})]);

    logger.info('Database cleaned successfully');
  } catch (error) {
    logger.error('Error cleaning database:', error);
    throw error;
  }
}

export default {
  loadUser,
  loadUserBatch,
  updateProgramStats,
  cleanDatabase,
};
