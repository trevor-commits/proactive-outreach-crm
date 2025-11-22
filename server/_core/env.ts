import path from "path";

const localDbPathFromEnv = process.env.LOCAL_DB_PATH?.trim();
const resolvedLocalDbPath =
  localDbPathFromEnv && localDbPathFromEnv.length > 0
    ? path.resolve(localDbPathFromEnv)
    : path.resolve(process.cwd(), "proactive-outreach-crm.db");

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  localAuthBypass: process.env.LOCAL_AUTH_BYPASS === "true",
  localDbPath: resolvedLocalDbPath,
};

export function resolveDatabasePath() {
  return resolvedLocalDbPath;
}
