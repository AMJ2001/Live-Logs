import express from 'express';
import dotenv from 'dotenv';
import { getJobStats, getStats, getUser, githubLogin, loginUser, logoutUser, queueStatus, requireAuth, signupUser, uploadLogs } from './endpoints';

dotenv.config();

const app = express();
app.use(express.json());

app.post('/api/upload-logs', uploadLogs);
app.get('/api/stats', getStats);
app.get('/api/stats/:jobId', getJobStats);
app.get('/api/queue-status', queueStatus);

app.post('/api/auth/login', loginUser);
app.post('/api/auth/signup', signupUser);
app.post('/api/auth/logout', logoutUser);
app.get('/api/auth/user', getUser);
app.get('/api/auth/github-login', githubLogin);
// Protect dashboard-related APIs
app.get('/api/stats', requireAuth, getStats);
app.get('/api/stats/:jobId', requireAuth, getJobStats);
app.get('/api/queue-status', requireAuth, queueStatus);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));