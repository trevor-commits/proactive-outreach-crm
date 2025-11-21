import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import * as db from './db';

export interface ExtractedMessage {
  phone: string;
  date: Date;
  text: string;
  isFromMe: boolean;
}

export interface ExtractedCall {
  phone: string;
  date: Date;
  duration: number;
  isOutgoing: boolean;
}

export interface ExtractionResult {
  messages: ExtractedMessage[];
  calls: ExtractedCall[];
}

// Lazy-load SQL.js instance
let SQL: any = null;

async function getSqlInstance() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

/**
 * Convert Apple's Core Data timestamp to JavaScript Date
 * Apple timestamps are seconds since 2001-01-01 00:00:00 UTC
 */
function appleTimestampToDate(timestamp: number): Date {
  const appleEpoch = new Date('2001-01-01T00:00:00Z').getTime();

  if (!timestamp || !Number.isFinite(timestamp)) {
    return new Date(0);
  }

  let seconds = timestamp;

  // Newer iOS uses nanoseconds since 2001-01-01; older uses seconds.
  if (timestamp > 1e12) {
    seconds = timestamp / 1e9;
  }

  return new Date(appleEpoch + seconds * 1000);
}

/**
 * Extract messages from iPhone sms.db database
 */
export async function extractMessages(dbPath: string): Promise<ExtractedMessage[]> {
  const messages: ExtractedMessage[] = [];

  try {
    const SQL = await getSqlInstance();
    const fileBuffer = fs.readFileSync(dbPath);
    const database = new SQL.Database(fileBuffer);

    // Query to get all messages with handles (phone numbers/emails)
    const query = `
      SELECT 
        message.ROWID,
        message.text,
        message.date,
        message.is_from_me,
        handle.id as handle_id
      FROM message
      LEFT JOIN handle ON message.handle_id = handle.ROWID
      WHERE message.text IS NOT NULL
      ORDER BY message.date DESC
    `;

    const results = database.exec(query);

    if (results.length > 0) {
      const columns = results[0].columns;
      const values = results[0].values;

      // Find column indices
      const textIdx = columns.indexOf('text');
      const dateIdx = columns.indexOf('date');
      const isFromMeIdx = columns.indexOf('is_from_me');
      const handleIdIdx = columns.indexOf('handle_id');

      for (const row of values) {
        const handleId = row[handleIdIdx];
        if (handleId) {
          messages.push({
            phone: String(handleId),
            date: appleTimestampToDate(Number(row[dateIdx])),
            text: String(row[textIdx] || ''),
            isFromMe: Number(row[isFromMeIdx]) === 1,
          });
        }
      }
    }

    database.close();
  } catch (error) {
    console.error('Error extracting messages:', error);
    throw new Error(`Failed to extract messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return messages;
}

/**
 * Extract call history from iPhone CallHistory.storedata database
 */
export async function extractCalls(dbPath: string): Promise<ExtractedCall[]> {
  const calls: ExtractedCall[] = [];

  try {
    const SQL = await getSqlInstance();
    const fileBuffer = fs.readFileSync(dbPath);
    const database = new SQL.Database(fileBuffer);

    // Primary query for modern iOS CallHistory.storedata schema
    const query = `
      SELECT
        h.ZVALUE as phone,
        c.ZDATE as date,
        c.ZDURATION as duration,
        c.ZORIGINATED as is_outgoing
      FROM ZCALLRECORD c
      JOIN Z_2REMOTEPARTICIPANTHANDLES l
        ON l.Z_2REMOTEPARTICIPANTCALLS = c.Z_PK
      JOIN ZHANDLE h
        ON h.Z_PK = l.Z_4REMOTEPARTICIPANTHANDLES
      WHERE h.ZVALUE IS NOT NULL
      ORDER BY c.ZDATE DESC
    `;

    const results = database.exec(query);

    if (results.length > 0) {
      const columns = results[0].columns;
      const values = results[0].values;

      // Find column indices
      const phoneIdx = columns.indexOf('phone');
      const dateIdx = columns.indexOf('date');
      const durationIdx = columns.indexOf('duration');
      const isOutgoingIdx = columns.indexOf('is_outgoing');

      for (const row of values) {
        calls.push({
          phone: String(row[phoneIdx]),
          date: appleTimestampToDate(Number(row[dateIdx])),
          duration: Number(row[durationIdx]) || 0,
          isOutgoing: Number(row[isOutgoingIdx]) === 1,
        });
      }
    }

    database.close();
  } catch (error) {
    console.error('Error extracting calls:', error);
    throw new Error(
      `Failed to extract calls: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }

  return calls;
}

/**
 * Process extracted iPhone data and match to customers
 */
export async function processIPhoneData(
  userId: number,
  messages: ExtractedMessage[],
  calls: ExtractedCall[]
): Promise<{ matched: number; unmatched: number }> {
  await db.getDb();

  let matched = 0;
  let unmatched = 0;

  // Process messages
  for (const message of messages) {
    // Try to find customer by phone
    const normalizedPhone = db.normalizePhoneNumber(message.phone);
    const customer = await db.findCustomerByPhone(normalizedPhone, userId);

    if (customer) {
      // Create interaction
      await db.createInteraction({
        customerId: customer.id,
        userId,
        type: 'sms',
        direction: message.isFromMe ? 'outgoing' : 'incoming',
        date: message.date,
        content: message.text,
        source: 'iphone',
      });
      matched++;
    } else {
      // Could also check if it's an email address for iMessage
      if (message.phone.includes('@')) {
        const normalizedEmail = db.normalizeEmail(message.phone);
        const customerByEmail = await db.findCustomerByEmail(normalizedEmail, userId);
        
        if (customerByEmail) {
          await db.createInteraction({
            customerId: customerByEmail.id,
            userId,
            type: 'sms',
            direction: message.isFromMe ? 'outgoing' : 'incoming',
            date: message.date,
            content: message.text,
            source: 'iphone',
          });
          matched++;
        } else {
          unmatched++;
        }
      } else {
        unmatched++;
      }
    }
  }

  // Process calls
  for (const call of calls) {
    const normalizedPhone = db.normalizePhoneNumber(call.phone);
    const customer = await db.findCustomerByPhone(normalizedPhone, userId);

    if (customer) {
      await db.createInteraction({
        customerId: customer.id,
        userId,
        type: 'call',
        direction: call.isOutgoing ? 'outgoing' : 'incoming',
        date: call.date,
        content: `Call duration: ${call.duration} seconds`,
        source: 'iphone',
        metadata: JSON.stringify({ duration: call.duration }),
      });
      matched++;
    } else {
      unmatched++;
    }
  }

  return { matched, unmatched };
}

/**
 * Main extraction function that processes uploaded database files
 */
export async function extractFromIPhoneBackup(
  userId: number,
  smsDbPath: string,
  callHistoryDbPath?: string
): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    messages: [],
    calls: [],
  };

  // Extract messages if sms.db is provided
  if (smsDbPath && fs.existsSync(smsDbPath)) {
    result.messages = await extractMessages(smsDbPath);
  }

  // Extract calls if CallHistory.storedata is provided
  if (callHistoryDbPath && fs.existsSync(callHistoryDbPath)) {
    result.calls = await extractCalls(callHistoryDbPath);
  }

  return result;
}
