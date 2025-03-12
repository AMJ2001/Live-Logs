import { Request, Response } from 'express';
import { logQueue } from './logQueue';
import { supabase } from './supabaseClient';

export const uploadLogs = async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'File path required' });

    const job = await logQueue.add('process-log', { filePath });
    res.json({ jobId: job.id, message: 'Log file queued for processing' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStats = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('log_stats').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// api/stats/[jobId].ts - Fetch stats for a specific job
export const getJobStats = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { data, error } = await supabase.from('log_stats').select('*').eq('job_id', jobId);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const queueStatus = async (_req: Request, res: Response) => {
  const active = await logQueue.getActiveCount();
  const waiting = await logQueue.getWaitingCount();
  const completed = await logQueue.getCompletedCount();
  res.json({ active, waiting, completed });
};