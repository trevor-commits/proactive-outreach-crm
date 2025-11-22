import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { AddressInfo } from 'net';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const createDataSource = vi.fn(async () => ({ id: 123 }));
const updateDataSource = vi.fn(async () => undefined);
const extractFromIPhoneBackup = vi.fn(async () => ({
  messages: [{ phone: '+15555550123', date: new Date(), text: 'Hello', isFromMe: true }],
  calls: [{ phone: '+15555550123', date: new Date(), duration: 10, isOutgoing: false }],
}));
const processIPhoneData = vi.fn(async () => ({ matched: 1, unmatched: 0 }));
const authenticateRequest = vi.fn(async () => ({ id: 1 }));

vi.mock('./db', () => ({
  createDataSource,
  updateDataSource,
}));

vi.mock('./iphone-extractor', () => ({
  extractFromIPhoneBackup,
  processIPhoneData,
}));

vi.mock('./_core/sdk', () => ({
  sdk: { authenticateRequest },
}));

describe('iphone router upload', () => {
  let tempDir: string;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crm-router-'));
    process.env.LOCAL_DB_PATH = path.join(tempDir, 'test.db');
  });

  afterEach(() => {
    delete process.env.LOCAL_DB_PATH;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('uploads backup and returns success response', async () => {
    const app = express();
    const router = (await import('./iphone-router')).default;
    app.use('/iphone', router);

    const server = app.listen(0);

    try {
      const { port } = server.address() as AddressInfo;
      const form = new FormData();
      form.append('smsDb', new Blob(['mock sms db']), 'sms.db');

      const response = await fetch(`http://127.0.0.1:${port}/iphone/upload`, {
        method: 'POST',
        body: form,
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({
        success: true,
        messagesExtracted: 1,
        callsExtracted: 1,
        matched: 1,
        unmatched: 0,
      });

      expect(authenticateRequest).toHaveBeenCalledTimes(1);
      expect(createDataSource).toHaveBeenCalledTimes(1);
      expect(updateDataSource).toHaveBeenCalledWith(
        expect.any(Number),
        1,
        expect.objectContaining({ status: 'completed' })
      );

      expect(extractFromIPhoneBackup).toHaveBeenCalledTimes(1);
      const [userId, smsPath, callHistoryPath] = extractFromIPhoneBackup.mock.calls[0];
      expect(userId).toBe(1);
      expect(smsPath).toMatch(/\/tmp\/iphone-uploads\//);
      expect(callHistoryPath).toBeUndefined();

      expect(processIPhoneData).toHaveBeenCalledWith(1, expect.any(Array), expect.any(Array));
    } finally {
      server.close();
    }
  });
});
