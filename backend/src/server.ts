import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';
import { getJobStats, getStats,queueStatus, requireAuth, upload, uploadLogsHandler } from './endpoints';
import rateLimit from 'express-rate-limit';
import { redis } from './redisClient';
import './logWorker';

dotenv.config();

export const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err));

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', apiLimiter);

//Endpoints
app.post("/api/upload-logs", upload.single("file"), uploadLogsHandler);
app.get('/api/auth/user');
app.get('/api/auth/github-login');

app.get('/api/stats', requireAuth, getStats);
app.get('/api/stats/:jobId', requireAuth, getJobStats);
app.get('/api/queue-status', requireAuth, queueStatus);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));