import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Customers table - master list of all clients/contacts
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of this customer record
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }), // E.164 format: +15551234567
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  emailIdx: index("email_idx").on(table.email),
  phoneIdx: index("phone_idx").on(table.phone),
}));

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Interactions table - all communication history (calls, texts, emails, meetings)
 */
export const interactions = mysqlTable("interactions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["call", "sms", "email", "calendar_event", "manual_note"]).notNull(),
  direction: mysqlEnum("direction", ["incoming", "outgoing", "bidirectional"]),
  date: timestamp("date").notNull(),
  subject: varchar("subject", { length: 500 }),
  content: text("content"),
  source: mysqlEnum("source", ["iphone", "gmail", "google_calendar", "manual"]).notNull(),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  customerIdIdx: index("customerId_idx").on(table.customerId),
  userIdIdx: index("userId_idx").on(table.userId),
  dateIdx: index("date_idx").on(table.date),
  typeIdx: index("type_idx").on(table.type),
}));

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

/**
 * Services table - track services performed for customers
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  userId: int("userId").notNull(),
  serviceName: varchar("serviceName", { length: 255 }).notNull(),
  serviceDate: timestamp("serviceDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  customerIdIdx: index("customerId_idx").on(table.customerId),
  userIdIdx: index("userId_idx").on(table.userId),
  serviceDateIdx: index("serviceDate_idx").on(table.serviceDate),
  serviceNameIdx: index("serviceName_idx").on(table.serviceName),
}));

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Outreach logs table - track outreach attempts and responses
 */
export const outreachLogs = mysqlTable("outreachLogs", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  userId: int("userId").notNull(),
  contactedDate: timestamp("contactedDate").notNull(),
  responseReceived: boolean("responseReceived").default(false).notNull(),
  responseType: mysqlEnum("responseType", ["positive", "negative", "neutral", "no_response"]),
  notes: text("notes"),
  nextContactDate: timestamp("nextContactDate"), // Specific future contact date
  nextContactMonth: int("nextContactMonth"), // Month (1-12) for seasonal reminders
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  customerIdIdx: index("customerId_idx").on(table.customerId),
  userIdIdx: index("userId_idx").on(table.userId),
  contactedDateIdx: index("contactedDate_idx").on(table.contactedDate),
  nextContactDateIdx: index("nextContactDate_idx").on(table.nextContactDate),
}));

export type OutreachLog = typeof outreachLogs.$inferSelect;
export type InsertOutreachLog = typeof outreachLogs.$inferInsert;

/**
 * Data sources table - track import status and metadata
 */
export const dataSources = mysqlTable("dataSources", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sourceType: mysqlEnum("sourceType", ["iphone_backup", "gmail", "google_calendar"]).notNull(),
  lastSyncDate: timestamp("lastSyncDate"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
  metadata: text("metadata"), // JSON string for additional sync info
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  sourceTypeIdx: index("sourceType_idx").on(table.sourceType),
}));

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = typeof dataSources.$inferInsert;

/**
 * Google credentials table - store OAuth tokens for Google API access
 */
export const googleCredentials = mysqlTable("googleCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  scope: text("scope"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type GoogleCredential = typeof googleCredentials.$inferSelect;
export type InsertGoogleCredential = typeof googleCredentials.$inferInsert;
