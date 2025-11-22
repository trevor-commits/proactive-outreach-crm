import { eq, and, desc, gte, sql, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { 
  InsertUser, 
  users, 
  customers, 
  InsertCustomer, 
  Customer,
  interactions,
  InsertInteraction,
  Interaction,
  services,
  InsertService,
  Service,
  outreachLogs,
  InsertOutreachLog,
  OutreachLog,
  dataSources,
  InsertDataSource,
  DataSource,
  googleCredentials,
  InsertGoogleCredential,
  GoogleCredential
} from "../drizzle/schema";
import { ENV } from './_core/env';

const DB_FILE = process.env.LOCAL_DB_PATH || path.resolve(process.cwd(), "proactive-outreach-crm.db");

let sqlite: Database.Database | undefined;
let _db: ReturnType<typeof drizzle> | undefined;

function initializeDatabase(): ReturnType<typeof drizzle> {
  if (_db) {
    return _db;
  }

  const directory = path.dirname(DB_FILE);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!sqlite) {
    sqlite = new Database(DB_FILE);
  }

  _db = drizzle(sqlite);

  if (!_db) {
    throw new Error("Failed to initialize database");
  }

  return _db;
}

export function getDb(): ReturnType<typeof drizzle> {
  return initializeDatabase();
}

// ============================================================================
// User Management
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Customer Management
// ============================================================================

export async function createCustomer(customer: InsertCustomer): Promise<Customer> {
  const db = await getDb();

  const [created] = await db.insert(customers).values(customer).returning();
  return created;
}

export async function getCustomersByUserId(userId: number): Promise<Customer[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(customers).where(eq(customers.userId, userId)).orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: number, userId: number): Promise<Customer | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(customers)
    .where(and(eq(customers.id, id), eq(customers.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function updateCustomer(id: number, userId: number, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(customers)
    .set(updates)
    .where(and(eq(customers.id, id), eq(customers.userId, userId)));

  return getCustomerById(id, userId);
}

export async function deleteCustomer(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(customers).where(and(eq(customers.id, id), eq(customers.userId, userId)));
}

export async function findCustomerByPhone(phone: string, userId: number): Promise<Customer | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(customers)
    .where(and(eq(customers.phone, phone), eq(customers.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function findCustomerByEmail(email: string, userId: number): Promise<Customer | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(customers)
    .where(and(eq(customers.email, email), eq(customers.userId, userId)))
    .limit(1);
  
  return result[0];
}

// ============================================================================
// Interaction Management
// ============================================================================

export async function createInteraction(interaction: InsertInteraction): Promise<Interaction> {
  const db = await getDb();

  const [created] = await db.insert(interactions).values(interaction).returning();
  return created;
}

export async function getInteractionsByCustomerId(customerId: number, userId: number): Promise<Interaction[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(interactions)
    .where(and(eq(interactions.customerId, customerId), eq(interactions.userId, userId)))
    .orderBy(desc(interactions.date));
}

export async function getRecentInteractionsByCustomerId(customerId: number, userId: number, limit: number = 10): Promise<Interaction[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(interactions)
    .where(and(eq(interactions.customerId, customerId), eq(interactions.userId, userId)))
    .orderBy(desc(interactions.date))
    .limit(limit);
}

export async function getLastInteractionDate(customerId: number, userId: number): Promise<Date | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select({ date: interactions.date })
    .from(interactions)
    .where(and(eq(interactions.customerId, customerId), eq(interactions.userId, userId)))
    .orderBy(desc(interactions.date))
    .limit(1);

  return result[0]?.date || null;
}

// ============================================================================
// Service Management
// ============================================================================

export async function createService(service: InsertService): Promise<Service> {
  const db = await getDb();

  const [created] = await db.insert(services).values(service).returning();
  return created;
}

export async function getServicesByCustomerId(customerId: number, userId: number): Promise<Service[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(services)
    .where(and(eq(services.customerId, customerId), eq(services.userId, userId)))
    .orderBy(desc(services.serviceDate));
}

export async function getServicesByUserId(userId: number): Promise<Service[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(services)
    .where(eq(services.userId, userId))
    .orderBy(desc(services.serviceDate));
}

export async function updateService(id: number, userId: number, updates: Partial<InsertService>): Promise<Service | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(services)
    .set(updates)
    .where(and(eq(services.id, id), eq(services.userId, userId)));

  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0];
}

export async function deleteService(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(services).where(and(eq(services.id, id), eq(services.userId, userId)));
}

// ============================================================================
// Outreach Log Management
// ============================================================================

export async function createOutreachLog(log: InsertOutreachLog): Promise<OutreachLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(outreachLogs).values(log);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(outreachLogs).where(eq(outreachLogs.id, insertedId)).limit(1);
  return created[0];
}

export async function getAllOutreachLogs(userId: number): Promise<OutreachLog[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(outreachLogs)
    .where(eq(outreachLogs.userId, userId))
    .orderBy(desc(outreachLogs.contactedDate));
}

export async function getOutreachLogsByCustomerId(customerId: number, userId: number): Promise<OutreachLog[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(outreachLogs)
    .where(and(eq(outreachLogs.customerId, customerId), eq(outreachLogs.userId, userId)))
    .orderBy(desc(outreachLogs.contactedDate));
}

export async function getLastOutreachLog(customerId: number, userId: number): Promise<OutreachLog | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(outreachLogs)
    .where(and(eq(outreachLogs.customerId, customerId), eq(outreachLogs.userId, userId)))
    .orderBy(desc(outreachLogs.contactedDate))
    .limit(1);

  return result[0] || null;
}

export async function updateOutreachLog(id: number, userId: number, updates: Partial<InsertOutreachLog>): Promise<OutreachLog | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(outreachLogs)
    .set(updates)
    .where(and(eq(outreachLogs.id, id), eq(outreachLogs.userId, userId)));

  const result = await db.select().from(outreachLogs).where(eq(outreachLogs.id, id)).limit(1);
  return result[0];
}

// ============================================================================
// Data Source Management
// ============================================================================

export async function createDataSource(source: InsertDataSource): Promise<DataSource> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(dataSources).values(source);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(dataSources).where(eq(dataSources.id, insertedId)).limit(1);
  return created[0];
}

export async function getDataSourcesByUserId(userId: number): Promise<DataSource[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(dataSources)
    .where(eq(dataSources.userId, userId))
    .orderBy(desc(dataSources.createdAt));
}

export async function updateDataSource(id: number, userId: number, updates: Partial<InsertDataSource>): Promise<DataSource | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(dataSources)
    .set(updates)
    .where(and(eq(dataSources.id, id), eq(dataSources.userId, userId)));

  const result = await db.select().from(dataSources).where(eq(dataSources.id, id)).limit(1);
  return result[0];
}

// ============================================================================
// Google Credentials Management
// ============================================================================

export async function upsertGoogleCredentials(credentials: InsertGoogleCredential): Promise<GoogleCredential> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(googleCredentials).values(credentials).onDuplicateKeyUpdate({
    set: {
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      expiresAt: credentials.expiresAt,
      scope: credentials.scope,
    },
  });

  const result = await db.select().from(googleCredentials)
    .where(eq(googleCredentials.userId, credentials.userId))
    .limit(1);
  
  return result[0];
}

export async function getGoogleCredentialsByUserId(userId: number): Promise<GoogleCredential | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(googleCredentials)
    .where(eq(googleCredentials.userId, userId))
    .limit(1);
  
  return result[0];
}

export async function deleteGoogleCredentials(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(googleCredentials).where(eq(googleCredentials.userId, userId));
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Normalize phone number to E.164 format
 * Basic implementation - can be enhanced with libphonenumber-js
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with 1 and has 11 digits, it's already in good shape
  if (digits.length === 11 && digits.startsWith('1')) {
    return '+' + digits;
  }
  
  // If it has 10 digits, assume US and add +1
  if (digits.length === 10) {
    return '+1' + digits;
  }
  
  // If it already starts with a country code
  if (digits.length > 10) {
    return '+' + digits;
  }
  
  // Return as-is with + prefix if we can't determine format
  return '+' + digits;
}

/**
 * Normalize email to lowercase
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
