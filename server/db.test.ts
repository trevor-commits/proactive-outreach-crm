import { beforeEach, describe, expect, test, vi } from "vitest";

const createPoolMock = vi.fn();
const drizzleMock = vi.fn();

vi.mock("mysql2/promise", () => ({
  default: {
    createPool: createPoolMock,
  },
  createPool: createPoolMock,
}));

vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: drizzleMock,
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("getDb", () => {
  test("throws when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { getDb } = await import("./db");
    await expect(getDb()).rejects.toThrow("DATABASE_URL is not configured");
  });

  test("initializes drizzle with mysql2 pool and reuses the instance", async () => {
    vi.stubEnv("DATABASE_URL", "mysql://user:pass@localhost:3306/testdb");
    const dbInstance = { marker: "db" };
    drizzleMock.mockReturnValue(dbInstance);

    const { getDb } = await import("./db");

    const first = await getDb();
    const second = await getDb();

    expect(createPoolMock).toHaveBeenCalledTimes(1);
    expect(createPoolMock).toHaveBeenCalledWith("mysql://user:pass@localhost:3306/testdb");
    expect(drizzleMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(dbInstance);
    expect(second).toBe(dbInstance);
  });
});
