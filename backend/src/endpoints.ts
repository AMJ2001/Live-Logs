import { Request, Response } from 'express';
import { logQueue } from './logQueue';
import { supabase } from './supabaseClient';
import { WebSocketServer } from "ws";
import multer from "multer";
const wss = new WebSocketServer({ port: 3001 });

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
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
      console.log(req.file.path);
      const job = await logQueue.add("process-log", { filePath });
      console.log(job);
      res.json({ jobId: job.id, message: "Log file queued for processing" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadLogs = [
  upload.single("file"), // Expecting 'file' key in FormData
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { originalname, buffer } = req.file;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("logs") // Replace with your actual bucket name
        .upload(`logs/${Date.now()}_${originalname}`, buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) throw error;

      // Enqueue a job in BullMQ
      const job = await logQueue.add("process-log", {
        fileId: data.path,
        filePath: data.fullPath, // Adjust based on Supabase response
      });

      res.json({ jobId: job.id, message: "Log file queued for processing" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
];

export const getStats = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('log_stats').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobStats = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { data, error } = await supabase.from('log_stats').select('*').eq('job_id', jobId);
    if (error) throw error;
    res.json(data);
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

export const logoutUser = async (_req: Request, res: Response) => {
  try {
    await supabase.auth.signOut();
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUser = async (_req: Request, res: Response) => {
  try {
    const { data: user, error } = await supabase.auth.getUser();
    if (error) { res.status(401).json({ error: 'Unauthorized' }); }
    res.status(200).json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const githubLogin = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    });

    if (error) { res.status(400).json({ error: error.message }); }
    res.json({ url: data.url }); // Redirect frontend to GitHub login page
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const requireAuth = async (req: Request, res: Response, next: Function) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); }

  const { data, error } = await supabase.auth.getUser(token);
  if (error) { res.status(401).json({ error: 'Invalid token' }); }

  //req['user'] = data.user;
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