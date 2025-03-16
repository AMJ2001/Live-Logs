import { Request, Response } from 'express';
import { logQueue, queueEvents } from './logQueue';
import { supabase } from './supabaseClient';
import { WebSocketServer } from "ws";
import multer from "multer";
const wss = new WebSocketServer({ port: Number(process.env.WEBSOCKET_PORT) || 3001 });

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_PATH || "uploads/",
  filename: (_, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });

export const uploadLogsHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
    } else {
      const filePath = req.file.path;
      const job = await logQueue.add("process-log", { filePath });
      res.json({ jobId: job.id, message: "Log file queued for processing" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization as string;
    if (!token) { res.status(401).json({ error: 'Unauthorized' }); }

    const userPayload = await supabase.auth.getUser(token);
    const { data, error } = await supabase.from('log_stats').select('*').eq('user_id', userPayload.data?.user?.id);
    if (error) { throw error; }

    const formattedData = data.map((ele: any) => ({
      jobId: ele.jobid,
      fileName: ele.file_path.split('/').pop(),
      status: ele.error_count > 0 ? "Failed" : "Success",
    }));

    res.json(formattedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobStats = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params as Record<string, string>;
    const token = req.headers.authorization as string;
    if (!token) { res.status(401).json({ error: 'Unauthorized' }); }

    const userPayload = await supabase.auth.getUser(token);
    const { data, error } = await supabase.from('log_stats').select('*').eq('jobid', jobId).eq('user_id', userPayload.data?.user?.id);
    if (error) { throw error; }

    const formattedData = data.map((ele: any) => ({
      jobId: ele.jobid,
      fileName: ele.file_path.split('/').pop(),
      status: ele.error_count > 0 ? "Failed" : "Success",
      keywords: ele.keyword_hits,
      ips: ele.ip_hits
    }));

    res.json(formattedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const queueStatus = async (_req: Request, res: Response) => {
  try {
    const active = await logQueue.getActiveCount();
    const waiting = await logQueue.getWaitingCount();
    const completed = await logQueue.getCompletedCount();
    res.json({ active, waiting, completed });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const requireAuth = async (req: Request, res: Response, next: Function) => {
  try {
    const token = req.headers.authorization as string;
    if (!token) { res.status(401).json({ error: 'Unauthorized' }); }
    const { data, error } = await supabase.auth.getUser(token);
    if (error) { 
      res.status(401).json({ error: 'Invalid token', reason: error });
    } else {
      next();
    }
  } catch (err) {
    res.status(400).json({ error: 'Unable to authorize' });
  }
};

queueEvents.on("progress", (job) => {
  wss.clients.forEach((client) => {
    console.log('wss', job);
    client.send(JSON.stringify({ type: "jobUpdate", payload: { jobId: job.jobId, status: "in-progress" } }));
  });
});

queueEvents.on("completed", (job) => {
  wss.clients.forEach((client) => {
    client.send(JSON.stringify({ type: "jobUpdate", payload: { jobId: job.jobId, status: "completed" } }));
  });
});
