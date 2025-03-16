import request from 'supertest';
import { app } from '../server';
import { Queue } from 'bullmq';

jest.mock('bullmq');
jest.mock('multer', () => () => ({
  single: () => (req: any, res: any, next: any) => {
    req.file = { path: 'test.log' };
    next();
  },
}));

describe('POST /api/upload-logs', () => {
  const mockQueueAdd = jest.fn();
  beforeAll(() => {
    Queue.prototype.add = mockQueueAdd;
  });

  test('should add a job to the queue and return 200', async () => {
    mockQueueAdd.mockResolvedValueOnce({ id: 'job123' });

    const res = await request(app).post('/api/upload-logs').attach('file', './test.log');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ jobId: 'job123' });
    expect(mockQueueAdd).toHaveBeenCalledWith('logJob', expect.any(Object));
  });

  test('should return 500 if job queue fails', async () => {
    mockQueueAdd.mockRejectedValueOnce(new Error('Queue error'));

    const res = await request(app).post('/api/upload-logs').attach('file', './test.log');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Queue error' });
  });
});
