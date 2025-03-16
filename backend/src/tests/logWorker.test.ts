import { processLog } from "../logWorker";
import fs from 'fs';
import { supabase } from '../supabaseClient';
import { Readable } from 'stream';

jest.mock('fs');
jest.mock('./supabaseClient');

describe('processLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should process logs and insert stats into Supabase', async () => {
    const mockFileData = `[2025-03-17] INFO Test log message {}\n[2025-03-17] ERROR Error log message {"ip":"192.168.1.1"}\n`;
    const mockStream = Readable.from(mockFileData.split('\n'));
    jest.spyOn(fs, 'createReadStream').mockReturnValue(mockStream as any);

    supabase.from = jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    const mockJob = { data: { filePath: 'test.log' } };
    await processLog(mockJob as any);

    expect(supabase.from).toHaveBeenCalledWith('log_stats');
    expect(supabase.from('log_stats').insert).toHaveBeenCalledWith(
      expect.objectContaining({
        file_path: 'test.log',
        total_lines: 2,
        error_count: 1,
        keyword_hits: 0,
        ip_hits: 1,
      })
    );
  });

  test('should throw an error if Supabase insert fails', async () => {
    const mockFileData = `[2025-03-17] INFO Test log message {}\n`;
    const mockStream = Readable.from(mockFileData.split('\n'));
    jest.spyOn(fs, 'createReadStream').mockReturnValue(mockStream as any);

    supabase.from = jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: { message: 'Insert failed' } }),
    });

    const mockJob = { data: { filePath: 'test.log' } };
    await expect(processLog(mockJob as any)).rejects.toThrow('Supabase Insert Error: Insert failed');
  });
});
