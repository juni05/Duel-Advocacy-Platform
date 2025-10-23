import dotenv from 'dotenv';
dotenv.config();

import { extractFiles } from './extractor';
import { validateUser } from './validator';
import { transformUser } from './transformer';
import { loadUserBatch, updateProgramStats, cleanDatabase } from './loader';
import { connectDB, disconnectDB } from '../utils/db';
import { logger } from '../utils/logger';
import { validateEnv } from '../utils/env';
import type { ETLStatistics, User } from '../types';

export type PipelineOptions = {
  dataDir: string;
  batchSize?: number;
  cleanDatabase?: boolean;
  maxFiles?: number;
};

/**
 * Deduplicate users by userId, keeping the most complete record
 */
function deduplicateUsers(users: User[]): User[] {
  const userMap = new Map<string, User>();

  for (const user of users) {
    const existing = userMap.get(user.userId);

    if (!existing) {
      userMap.set(user.userId, user);
    } else {
      // Keep the record with more data
      const existingScore = calculateCompletenessScore(existing);
      const newScore = calculateCompletenessScore(user);

      if (newScore > existingScore) {
        userMap.set(user.userId, user);
      } else if (newScore === existingScore) {
        // If equal, merge the data
        userMap.set(user.userId, mergeUsers(existing, user));
      }
    }
  }

  return Array.from(userMap.values());
}

/**
 * Calculate how complete a user record is
 */
function calculateCompletenessScore(user: User): number {
  let score = 0;

  if (user.name) score += 1;
  if (user.email) score += 1;
  if (user.joinDate) score += 1;
  score += user.socialHandles.length * 2;
  score += user.programs.length * 3;
  score += user.posts.length;
  score += user.salesAttributions.length * 5;
  score += user.totalEngagement;
  score += user.totalSales;

  return score;
}

/**
 * Merge two user records, taking the best data from each
 */
function mergeUsers(user1: User, user2: User): User {
  return {
    userId: user1.userId,
    name: user1.name || user2.name,
    email: user1.email || user2.email,
    joinDate: user1.joinDate || user2.joinDate,

    // Merge and deduplicate arrays
    socialHandles: deduplicateSocialHandles([
      ...user1.socialHandles,
      ...user2.socialHandles,
    ]),

    programs: deduplicatePrograms([...user1.programs, ...user2.programs]),

    posts: deduplicatePosts([...user1.posts, ...user2.posts]),

    salesAttributions: deduplicateSalesAttributions([
      ...user1.salesAttributions,
      ...user2.salesAttributions,
    ]),

    // Recalculate totals
    totalEngagement: 0, // Will be recalculated
    totalSales: 0, // Will be recalculated
  };
}

/**
 * Deduplicate social handles by platform
 */
function deduplicateSocialHandles(handles: User['socialHandles']) {
  const seen = new Map<string, (typeof handles)[0]>();

  for (const handle of handles) {
    const key = `${handle.platform}:${handle.handle}`;
    if (!seen.has(key)) {
      seen.set(key, handle);
    }
  }

  return Array.from(seen.values());
}

/**
 * Deduplicate programs by programId
 */
function deduplicatePrograms(programs: User['programs']) {
  const seen = new Map<string, (typeof programs)[0]>();

  for (const program of programs) {
    if (!seen.has(program.programId)) {
      seen.set(program.programId, program);
    }
  }

  return Array.from(seen.values());
}

/**
 * Deduplicate posts by postId
 */
function deduplicatePosts(posts: User['posts']) {
  const seen = new Map<string, (typeof posts)[0]>();

  for (const post of posts) {
    const existing = seen.get(post.postId);

    if (!existing) {
      seen.set(post.postId, post);
    } else {
      // Keep the post with higher engagement
      if (post.engagement > existing.engagement) {
        seen.set(post.postId, post);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Deduplicate and sum sales attributions by programId
 */
function deduplicateSalesAttributions(attributions: User['salesAttributions']) {
  const salesMap = new Map<string, number>();

  for (const attribution of attributions) {
    const current = salesMap.get(attribution.programId) || 0;
    salesMap.set(attribution.programId, current + attribution.amount);
  }

  return Array.from(salesMap.entries()).map(([programId, amount]) => ({
    programId,
    amount,
  }));
}

/**
 * Recalculate user totals after merging
 */
function recalculateTotals(user: User): User {
  user.totalEngagement = user.posts.reduce(
    (sum, post) => sum + post.engagement,
    0,
  );

  user.totalSales = user.salesAttributions.reduce(
    (sum, sale) => sum + sale.amount,
    0,
  );

  return user;
}

/**
 * Run the complete ETL pipeline with deduplication
 */
export async function runPipeline(
  options: PipelineOptions,
): Promise<ETLStatistics> {
  const env = validateEnv();
  const batchSize = options.batchSize || env.BATCH_SIZE;

  const statistics: ETLStatistics = {
    totalFiles: 0,
    processedFiles: 0,
    successfulRecords: 0,
    failedRecords: 0,
    validationErrors: 0,
    cleanRecords: 0,
    messyRecords: 0,
    startTime: new Date(),
  };

  logger.info('Starting ETL pipeline', {
    dataDir: options.dataDir,
    batchSize,
    cleanDatabase: options.cleanDatabase,
  });

  try {
    // Connect to database
    await connectDB();

    // Clean database if requested
    if (options.cleanDatabase) {
      logger.info('Cleaning database before processing...');
      await cleanDatabase();
    }

    // Collect all users first for deduplication
    let currentBatch: User[] = [];
    const processedUserIds = new Set<string>();

    // Extract, Transform, Validate in streaming fashion
    for await (const extracted of extractFiles({
      dataDir: options.dataDir,
      maxFiles: options.maxFiles,
    })) {
      statistics.totalFiles++;

      try {
        // Validate
        const validationResult = validateUser(extracted.data);

        if (!validationResult.success) {
          statistics.validationErrors++;
          statistics.failedRecords++;

          logger.warn('Validation failed', {
            file: extracted.fileName,
            errors: validationResult.errors?.issues.slice(0, 3),
          });
          continue;
        }

        // Track clean vs messy
        if (validationResult.isClean) {
          statistics.cleanRecords++;
        } else {
          statistics.messyRecords++;
        }

        // Transform
        const transformed = transformUser(
          validationResult.data as Record<string, unknown>,
        );

        // Add to batch
        currentBatch.push(transformed);

        // Process batch when it reaches batchSize
        if (currentBatch.length >= batchSize) {
          // Deduplicate within batch
          const deduplicatedBatch = deduplicateUsers(currentBatch);

          // Filter out users we've already processed
          const newUsers = deduplicatedBatch.filter(
            (user) => !processedUserIds.has(user.userId),
          );

          // Mark as processed
          newUsers.forEach((user) => processedUserIds.add(user.userId));

          logger.info('Batch deduplication', {
            original: currentBatch.length,
            deduplicated: deduplicatedBatch.length,
            new: newUsers.length,
            skipped: deduplicatedBatch.length - newUsers.length,
          });

          if (newUsers.length > 0) {
            // Recalculate totals for merged users
            newUsers.forEach(recalculateTotals);

            const loadResult = await loadUserBatch(newUsers, {
              batchSize,
              upsert: true, // Always upsert to handle updates
            });

            statistics.successfulRecords +=
              loadResult.inserted + loadResult.updated;
            statistics.failedRecords += loadResult.failed;
          }

          currentBatch = [];
        }

        statistics.processedFiles++;

        // Log progress every 100 files
        if (statistics.processedFiles % 100 === 0) {
          logger.info('Pipeline progress', {
            processed: statistics.processedFiles,
            total: statistics.totalFiles,
            successful: statistics.successfulRecords,
            failed: statistics.failedRecords,
            uniqueUsers: processedUserIds.size,
          });
        }
      } catch (error) {
        logger.error('Error processing file', {
          file: extracted.fileName,
          error,
        });
        statistics.failedRecords++;
      }
    }

    // Process remaining batch
    if (currentBatch.length > 0) {
      const deduplicatedBatch = deduplicateUsers(currentBatch);
      const newUsers = deduplicatedBatch.filter(
        (user) => !processedUserIds.has(user.userId),
      );

      newUsers.forEach((user) => processedUserIds.add(user.userId));

      logger.info(`Loading final batch`, {
        original: currentBatch.length,
        deduplicated: deduplicatedBatch.length,
        new: newUsers.length,
      });

      if (newUsers.length > 0) {
        newUsers.forEach(recalculateTotals);

        const loadResult = await loadUserBatch(newUsers, {
          batchSize,
          upsert: true,
        });

        statistics.successfulRecords +=
          loadResult.inserted + loadResult.updated;
        statistics.failedRecords += loadResult.failed;
      }
    }

    // Update program statistics
    logger.info('Updating program statistics...');
    await updateProgramStats();

    // Calculate final statistics
    statistics.endTime = new Date();
    statistics.durationMs =
      statistics.endTime.getTime() - statistics.startTime.getTime();

    logger.info('ETL pipeline completed successfully', {
      duration: `${(statistics.durationMs / 1000).toFixed(2)}s`,
      totalFiles: statistics.totalFiles,
      processedFiles: statistics.processedFiles,
      successfulRecords: statistics.successfulRecords,
      failedRecords: statistics.failedRecords,
      uniqueUsers: processedUserIds.size,
      cleanRecords: statistics.cleanRecords,
      messyRecords: statistics.messyRecords,
      validationErrors: statistics.validationErrors,
    });

    return statistics;
  } catch (error) {
    logger.error('ETL pipeline failed', error);
    throw error;
  } finally {
    await disconnectDB();
  }
}

// Run pipeline if executed directly
if (require.main === module) {
  const dataDir = process.env.DATA_DIR || './data';
  const cleanDB = process.env.CLEAN_DATABASE === 'true';

  runPipeline({
    dataDir,
    cleanDatabase: cleanDB, // Now properly passed through
  })
    .then((stats) => {
      logger.info('=== ETL Pipeline Results ===');
      logger.info(`Duration: ${((stats.durationMs || 0) / 1000).toFixed(2)}s`);
      logger.info(`Total Files: ${stats.totalFiles}`);
      logger.info(`Processed Files: ${stats.processedFiles}`);
      logger.info(`Successful Records: ${stats.successfulRecords}`);
      logger.info(`Failed Records: ${stats.failedRecords}`);
      logger.info(`Clean Records: ${stats.cleanRecords}`);
      logger.info(`Messy Records: ${stats.messyRecords}`);
      logger.info(`Validation Errors: ${stats.validationErrors}`);
      logger.info('============================');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Pipeline failed:', error);
      process.exit(1);
    });
}

export default { runPipeline };
