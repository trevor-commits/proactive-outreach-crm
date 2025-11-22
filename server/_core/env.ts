const isDevelopment = process.env.NODE_ENV === "development";
const localDbPath = process.env.LOCAL_DB_PATH ?? "";

if (isDevelopment && !localDbPath) {
  throw new Error("LOCAL_DB_PATH must be set in development");
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  localDbPath,
};

export function resolveDatabasePath() {
  return localDbPath || "proactive-outreach-crm.db";
}
