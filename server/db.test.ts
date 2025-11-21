import fs from "fs";
import os from "os";
import path from "path";
import { beforeEach, describe, expect, test, vi } from "vitest";

const originalCwd = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "po-crm-"));
const databasePaths: string[] = [];

vi.mock("better-sqlite3", () => {
  class MockDatabase {
    filename: string;

    constructor(filename: string) {
      this.filename = filename;
      databasePaths.push(filename);
    }

    prepare = vi.fn();

    exec = vi.fn();

    transaction = vi.fn();
  }

  return { default: MockDatabase };
});

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  process.chdir(originalCwd);
  databasePaths.length = 0;
});

describe("getDb", () => {
  test("initializes sqlite using LOCAL_DB_PATH and returns drizzle client", async () => {
    const dbPath = path.join(tempDir, `local-${Date.now()}.db`);
    vi.stubEnv("LOCAL_DB_PATH", dbPath);
    const { getDb } = await import("./db");
    const db = await getDb();
    expect(db).toBeTruthy();
    expect(databasePaths[0]).toBe(path.resolve(dbPath));
  });

  test("falls back to default local db path when unset", async () => {
    process.chdir(tempDir);
    const { getDb } = await import("./db");
    const db = await getDb();
    expect(db).toBeTruthy();
    expect(databasePaths[0]).toBe(
      path.resolve(tempDir, "proactive-outreach-crm.db")
    );
  });
});
