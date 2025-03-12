import { Worker, Job } from 'bullmq';
import fs from 'fs';
import readline from 'readline';
import { redis } from './redisClient';
import { supabase } from './supabaseClient';

const trackKeywords = (process.env.TRACK_KEYWORDS || '').split(',');
const trackIPs = (process.env.TRACK_IPS || '').split(',');

const processLog = async (job: Job) => {
  console.log(`Processing log: ${job.data.filePath}`);

  const fileStream = fs.createReadStream(job.data.filePath);
  const rl = readline.createInterface({ input: fileStream });

  let totalLines = 0;
  let errorCount = 0;
  let keywordHits = 0;
  let ipHits = 0;

  for await (const line of rl) {
    totalLines++;

    const logRegex = /^\[(.*?)\] (\w+) (.+?) (\{.*\})?$/;
    const match = line.match(logRegex);

    if (match) {
      const [, timestamp, level, message, jsonPayload] = match;
      const jsonData = jsonPayload ? JSON.parse(jsonPayload) : {};

      if (level.toLowerCase() === 'error') errorCount++;

      if (trackKeywords.some((kw) => message.toLowerCase().includes(kw))) {
        keywordHits++;
      }

      if (trackIPs.includes(jsonData.ip)) {
        ipHits++;
      }
    }
  }

  // Store stats in Supabase
  const { error } = await supabase.from('log_stats').insert({
    filePath: job.data.filePath,
    totalLines,
    errorCount,
    keywordHits,
    ipHits,
    processedAt: new Date(),
  });

  if (error) throw new Error(`Supabase Insert Error: ${error.message}`);

  console.log(`✅ Completed processing: ${job.data.filePath}`);
};

const worker = new Worker('log-processing-queue', processLog, {
  connection: redis,
  concurrency: 4,
});

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed: ${err.message}`);
});