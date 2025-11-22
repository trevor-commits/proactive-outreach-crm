import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const databasePaths: string[] = [];
const databaseInstances: unknown[] = [];
const drizzleMock = vi.fn((db: unknown) => ({ connection: db }));

vi.mock('drizzle-orm/better-sqlite3', () => ({
  drizzle: drizzleMock,
}));

vi.mock('better-sqlite3', () => {
  const DatabaseMock = vi.fn(function Database(this: { file?: string }, file: string) {
    this.file = file;
    databasePaths.push(file);
    databaseInstances.push(this);
  });
  return { default: DatabaseMock };
});

describe('getDb', () => {
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    databasePaths.length = 0;
    databaseInstances.length = 0;
    drizzleMock.mockClear();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crm-db-'));
    dbPath = path.join(tempDir, 'db.sqlite');
    process.env.LOCAL_DB_PATH = dbPath;
  });

  afterEach(() => {
    delete process.env.LOCAL_DB_PATH;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('uses LOCAL_DB_PATH and reuses sqlite instance', async () => {
    const { getDb } = await import('./db');

    const first = await getDb();
    const second = await getDb();

    expect(databasePaths).toEqual([dbPath]);
    expect(databaseInstances).toHaveLength(1);
    expect(first).toBe(second);
    expect(drizzleMock).toHaveBeenCalledTimes(1);
    expect(drizzleMock).toHaveBeenCalledWith(databaseInstances[0]);
  });
});
