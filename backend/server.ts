import express from 'express';
import dotenv from 'dotenv';
import { getJobStats, getStats, queueStatus, uploadLogs } from './endpoints';

dotenv.config();

const app = express();
app.use(express.json());

app.post('/api/upload-logs', uploadLogs);
app.get('/api/stats', getStats);
app.get('/api/stats/:jobId', getJobStats);
app.get('/api/queue-status', queueStatus);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));