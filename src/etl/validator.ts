import { z } from 'zod';
import { userSchema, socialPlatformSchema } from '../types';
import { logger } from '../utils/logger';

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
  isClean: boolean;
};

// Flexible schema for initial parsing (accepts messy data)
const flexibleSocialPostSchema = z
  .object({
    task_id: z
      .union([z.string(), z.number()])
      .transform(String)
      .nullable()
      .optional(),
    platform: z
      .union([z.string(), z.number()])
      .transform(String)
      .transform((val) => val.toLowerCase().trim())
      .pipe(socialPlatformSchema.catch('other'))
      .nullable()
      .optional(),
    post_url: z.string().nullable().optional(),
    likes: z
      .union([z.number(), z.string()])
      .transform(Number)
      .nullable()
      .optional(),
    comments: z
      .union([z.number(), z.string()])
      .transform(Number)
      .nullable()
      .optional(),
    shares: z
      .union([z.number(), z.string()])
      .transform(Number)
      .nullable()
      .optional(),
    reach: z
      .union([z.number(), z.string()])
      .transform(Number)
      .nullable()
      .optional(),
  })
  .passthrough();

// Not used - sales come from total_sales_attributed in programs

const flexibleProgramSchema = z
  .object({
    program_id: z
      .union([z.string(), z.number()])
      .transform(String)
      .nullable()
      .optional(),
    brand: z
      .union([z.string(), z.number()])
      .transform(String)
      .nullable()
      .optional(),
    tasks_completed: z.array(flexibleSocialPostSchema).nullable().optional(),
    total_sales_attributed: z
      .union([z.number(), z.string()])
      .transform(Number)
      .nullable()
      .optional(),
  })
  .passthrough();

// Flexible user schema for initial parsing
const flexibleUserSchema = z
  .object({
    user_id: z
      .union([z.string(), z.number()])
      .transform(String)
      .nullable()
      .optional(),
    name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    instagram_handle: z.string().nullable().optional(),
    tiktok_handle: z.string().nullable().optional(),
    advocacy_programs: z.array(flexibleProgramSchema).nullable().optional(),
    joined_at: z
      .union([z.string(), z.number(), z.date()])
      .nullable()
      .optional(),
  })
  .passthrough();

export function validateUser(
  data: unknown,
): ValidationResult<z.infer<typeof userSchema>> {
  try {
    // First, parse with flexible schema to handle messy data
    const flexibleResult = flexibleUserSchema.safeParse(data);

    if (!flexibleResult.success) {
      return {
        success: false,
        errors: flexibleResult.error,
        isClean: false,
      };
    }

    const raw = flexibleResult.data;

    // Check if we have user_id (can be null, we'll generate one in transformer)
    // Just need the data structure to be parseable
    // Check if data is "clean" (has all required fields with proper values)
    const isClean = !!(
      raw.user_id &&
      raw.user_id !== null &&
      raw.name &&
      raw.email &&
      raw.advocacy_programs &&
      Array.isArray(raw.advocacy_programs) &&
      raw.advocacy_programs.length > 0
    );

    // Accept the data even if messy - transformer will handle it
    return {
      success: true,
      data: raw as z.infer<typeof userSchema>,
      isClean,
    };
  } catch (error) {
    logger.error('Unexpected validation error:', error);
    return {
      success: false,
      isClean: false,
    };
  }
}

export function validateUserBatch(dataArray: unknown[]): {
  valid: z.infer<typeof userSchema>[];
  invalid: unknown[];
  cleanCount: number;
} {
  const valid: z.infer<typeof userSchema>[] = [];
  const invalid: unknown[] = [];
  let cleanCount = 0;

  for (const data of dataArray) {
    const result = validateUser(data);
    if (result.success && result.data) {
      valid.push(result.data);
      if (result.isClean) cleanCount++;
    } else {
      invalid.push(data);
    }
  }

  return { valid, invalid, cleanCount };
}

export default { validateUser, validateUserBatch };
