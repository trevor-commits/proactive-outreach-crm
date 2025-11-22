import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

it("resolves default local database path when unset", async () => {
  process.env = { ...originalEnv };
  delete process.env.LOCAL_DB_PATH;
  const mod = await import("./env");
  expect(mod.ENV.localDbPath).toBe(path.resolve(process.cwd(), "proactive-outreach-crm.db"));
  expect(mod.resolveDatabasePath()).toBe(mod.ENV.localDbPath);
});

it("resolves provided LOCAL_DB_PATH", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "po-crm-"));
  const customPath = path.join(tempDir, "custom.db");
  process.env = { ...originalEnv, LOCAL_DB_PATH: customPath };
  const mod = await import("./env");
  expect(mod.ENV.localDbPath).toBe(path.resolve(customPath));
});
