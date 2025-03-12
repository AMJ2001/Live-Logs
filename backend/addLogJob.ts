import { logQueue } from './logQueue';

export const addLogJob = async (filePath: string, fileSize: number) => {
  const priority = fileSize < 5 * 1024 * 1024 ? 1 : 2; // Smaller files get higher priority

  await logQueue.add('process-log', { filePath }, { priority });
  console.log(`Added job for ${filePath} with priority ${priority}`);
};