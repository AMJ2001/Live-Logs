import { Request, Response } from 'express';
import { logQueue } from './logQueue';
import { supabase } from './supabaseClient';
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3001 });

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
  try {
    const active = await logQueue.getActiveCount();
    const waiting = await logQueue.getWaitingCount();
    const completed = await logQueue.getCompletedCount();
    res.json({ active, waiting, completed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ user: data.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const signupUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ user: data.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logoutUser = async (_req: Request, res: Response) => {
  try {
    await supabase.auth.signOut();
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUser = async (_req: Request, res: Response) => {
  try {
    const { data: user, error } = await supabase.auth.getUser();
    if (error) return res.status(401).json({ error: 'Unauthorized' });
    return res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const githubLogin = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    });

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ url: data.url }); // Redirect frontend to GitHub login page
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const requireAuth = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: 'Invalid token' });

  req.user = data.user;
  next();
};

wss.on("connection", (ws) => {
  console.log("Client connected");

  const sendStats = () => {
    const stats = {
      errors: Math.floor(Math.random() * 50),
      keywords: ["error", "warning", "failed"],
      ips: ["192.168.1.1", "10.0.0.1"],
    };
    ws.send(JSON.stringify(stats));
  };

  sendStats(); // Send initial data
  const interval = setInterval(sendStats, 5000); // Update every 5s

  ws.on("close", () => clearInterval(interval));
});