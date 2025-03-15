import express from 'express';
import cors from "cors";
import dotenv from 'dotenv';
import { getJobStats, getStats, getUser, githubLogin, logoutUser, queueStatus, requireAuth, upload, uploadLogs, uploadLogsHandler } from './endpoints';
import { redis } from './redisClient';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err));

app.post("/api/upload-logs", upload.single("file"), uploadLogsHandler);
app.get('/api/stats', getStats);
app.get('/api/stats/:jobId', getJobStats);
app.get('/api/queue-status', queueStatus);

app.post('/api/auth/logout', logoutUser);
app.get('/api/auth/user', getUser);
app.get('/api/auth/github-login', githubLogin);
// Protect dashboard-related APIs
app.get('/api/stats', requireAuth, getStats);
app.get('/api/stats/:jobId', requireAuth, getJobStats);
app.get('/api/queue-status', requireAuth, queueStatus);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));