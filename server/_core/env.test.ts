import { expect, it, vi, afterEach } from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

it("throws when LOCAL_DB_PATH is missing in development", async () => {
  process.env = { ...originalEnv, NODE_ENV: "development" };
  delete process.env.LOCAL_DB_PATH;
  vi.resetModules();

  await expect(import("./env")).rejects.toThrow("LOCAL_DB_PATH");
});
