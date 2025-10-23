/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

export type ExtractOptions = {
  dataDir: string;
  filePattern?: RegExp;
  maxFiles?: number;
};

export type ExtractedData = {
  fileName: string;
  filePath: string;
  data: unknown;
};

/**
 * Read a single JSON file and parse its contents
 */
export async function extractFile(
  filePath: string,
): Promise<ExtractedData | null> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');

    // Try to parse JSON normally first
    try {
      const data = JSON.parse(content);
      return {
        fileName: path.basename(filePath),
        filePath,
        data,
      };
    } catch (parseError) {
      // If parsing fails, try to fix common JSON issues
      logger.warn('Initial JSON parsing failed, attempting to fix:', {
        filePath,
        error: parseError,
      });

      // Check if content ends with array closing but missing object closing
      const trimmedContent = content.trim();
      if (trimmedContent.endsWith(']') && !trimmedContent.endsWith('}')) {
        // Add missing closing object bracket
        content = content.trimEnd() + '\n}';
        logger.info('Added missing closing bracket to JSON file:', {
          filePath,
        });

        try {
          const data = JSON.parse(content);
          return {
            fileName: path.basename(filePath),
            filePath,
            data,
          };
        } catch (fixError) {
          logger.error('Failed to parse JSON even after attempting fix:', {
            filePath,
            error: fixError,
          });
          return null;
        }
      }

      // If we can't fix it, return null
      logger.error('Unable to fix JSON parsing error:', {
        filePath,
        error: parseError,
      });
      return null;
    }
  } catch (error) {
    logger.error('Error extracting file:', { filePath, error });
    return null;
  }
}

/**
 * Get list of JSON files from directory
 */
export async function getJsonFiles(
  dataDir: string,
  filePattern: RegExp = /\.json$/i,
): Promise<string[]> {
  try {
    const entries = await fs.readdir(dataDir, { withFileTypes: true });

    const files = entries
      .filter((entry) => entry.isFile() && filePattern.test(entry.name))
      .map((entry) => path.join(dataDir, entry.name));

    logger.info(`Found ${files.length} JSON files in ${dataDir}`);
    return files;
  } catch (error) {
    logger.error('Error reading directory:', { dataDir, error });
    throw error;
  }
}

/**
 * Extract data from all JSON files in directory
 */
export async function* extractFiles(
  options: ExtractOptions,
): AsyncGenerator<ExtractedData> {
  const { dataDir, filePattern = /\.json$/i, maxFiles } = options;

  try {
    // Check if directory exists
    await fs.access(dataDir);
  } catch (error) {
    logger.error('Data directory does not exist:', { dataDir });
    throw new Error(`Data directory not found: ${dataDir}`);
  }

  const files = await getJsonFiles(dataDir, filePattern);
  const filesToProcess = maxFiles ? files.slice(0, maxFiles) : files;

  logger.info(`Processing ${filesToProcess.length} files`);

  for (const filePath of filesToProcess) {
    const extracted = await extractFile(filePath);
    if (extracted) {
      yield extracted;
    }
  }
}

/**
 * Extract all files at once (for smaller datasets)
 */
export async function extractAllFiles(
  options: ExtractOptions,
): Promise<ExtractedData[]> {
  const results: ExtractedData[] = [];

  for await (const extracted of extractFiles(options)) {
    results.push(extracted);
  }

  return results;
}

export default { extractFile, extractFiles, extractAllFiles, getJsonFiles };
