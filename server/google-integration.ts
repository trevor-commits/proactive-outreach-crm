import { google, Auth } from 'googleapis';
type OAuth2Client = Auth.OAuth2Client;
import * as db from './db';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
];

/**
 * Create OAuth2 client with credentials
 */
function createOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Get authorization URL for user to grant access
 */
export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Get authenticated OAuth2 client for a user
 */
async function getAuthenticatedClient(userId: number): Promise<OAuth2Client> {
  const credentials = await db.getGoogleCredentialsByUserId(userId);
  
  if (!credentials || !credentials.accessToken) {
    throw new Error('User has not connected Google account');
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken || undefined,
    expiry_date: credentials.expiresAt?.getTime(),
  });

  // Check if token is expired and refresh if needed
  if (credentials.expiresAt && credentials.expiresAt < new Date()) {
    if (credentials.refreshToken) {
      const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();
      
      // Update stored credentials
      await db.upsertGoogleCredentials({
        userId,
        accessToken: newCredentials.access_token || null,
        refreshToken: newCredentials.refresh_token || credentials.refreshToken,
        expiresAt: newCredentials.expiry_date ? new Date(newCredentials.expiry_date) : null,
        scope: credentials.scope,
      });

      oauth2Client.setCredentials(newCredentials);
    } else {
      throw new Error('Access token expired and no refresh token available');
    }
  }

  return oauth2Client;
}

/**
 * Fetch Gmail messages for a specific email address
 */
export async function fetchGmailMessages(
  userId: number,
  customerEmail: string,
  lookbackDays: number = 365
): Promise<Array<{
  date: Date;
  subject: string;
  snippet: string;
  isFromMe: boolean;
}>> {
  const oauth2Client = await getAuthenticatedClient(userId);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const messages: Array<{
    date: Date;
    subject: string;
    snippet: string;
    isFromMe: boolean;
  }> = [];

  try {
    // Get user's email address
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const userEmail = profile.data.emailAddress?.toLowerCase();

    // Calculate date for lookback
    const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - lookbackDays);
    const afterTimestamp = Math.floor(afterDate.getTime() / 1000);

    // Search for messages involving this email
    const query = `{from:${customerEmail} OR to:${customerEmail}} after:${afterTimestamp}`;
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100,
    });

    if (!response.data.messages) {
      return messages;
    }

    // Fetch details for each message
    for (const message of response.data.messages) {
      if (!message.id) continue;

      const details = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
      });

      const headers = details.data.payload?.headers || [];
      const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || '';
      const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || '';
      const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date')?.value || '';

      // Determine direction
      const isFromMe = fromHeader.toLowerCase().includes(userEmail || '');

      messages.push({
        date: dateHeader ? new Date(dateHeader) : new Date(details.data.internalDate ? parseInt(details.data.internalDate) : Date.now()),
        subject: subjectHeader,
        snippet: details.data.snippet || '',
        isFromMe,
      });
    }
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }

  return messages;
}

/**
 * Fetch Google Calendar events for a specific email address
 */
export async function fetchCalendarEvents(
  userId: number,
  customerEmail: string,
  lookbackDays: number = 365
): Promise<Array<{
  date: Date;
  summary: string;
  description?: string;
  location?: string;
}>> {
  const oauth2Client = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const events: Array<{
    date: Date;
    summary: string;
    description?: string;
    location?: string;
  }> = [];

  try {
    // Calculate date range
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - lookbackDays);

    // Search for events with this attendee
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
      q: customerEmail, // Search in event details
    });

    if (!response.data.items) {
      return events;
    }

    for (const event of response.data.items) {
      // Check if customer email is in attendees
      const attendees = event.attendees || [];
      const hasCustomer = attendees.some(a => 
        a.email?.toLowerCase() === customerEmail.toLowerCase()
      );

      if (hasCustomer || event.summary?.includes(customerEmail)) {
        const startDate = event.start?.dateTime 
          ? new Date(event.start.dateTime)
          : event.start?.date 
            ? new Date(event.start.date)
            : new Date();

        events.push({
          date: startDate,
          summary: event.summary || 'Untitled Event',
          description: event.description || undefined,
          location: event.location || undefined,
        });
      }
    }
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }

  return events;
}

/**
 * Sync Gmail and Calendar data for a customer
 */
export async function syncGoogleDataForCustomer(
  userId: number,
  customerId: number,
  customerEmail: string,
  lookbackDays: number = 365
): Promise<{ emailsAdded: number; eventsAdded: number }> {
  let emailsAdded = 0;
  let eventsAdded = 0;

  // Fetch and store Gmail messages
  try {
    const messages = await fetchGmailMessages(userId, customerEmail, lookbackDays);
    
    for (const message of messages) {
      await db.createInteraction({
        customerId,
        userId,
        type: 'email',
        direction: message.isFromMe ? 'outgoing' : 'incoming',
        date: message.date,
        subject: message.subject,
        content: message.snippet,
        source: 'gmail',
      });
      emailsAdded++;
    }
  } catch (error) {
    console.error('Error syncing Gmail:', error);
  }

  // Fetch and store Calendar events
  try {
    const events = await fetchCalendarEvents(userId, customerEmail, lookbackDays);
    
    for (const event of events) {
      await db.createInteraction({
        customerId,
        userId,
        type: 'calendar_event',
        direction: 'bidirectional',
        date: event.date,
        subject: event.summary,
        content: event.description || undefined,
        source: 'google_calendar',
        metadata: event.location ? JSON.stringify({
          location: event.location,
        }) : undefined,
      });
      eventsAdded++;
    }
  } catch (error) {
    console.error('Error syncing Calendar:', error);
  }

  return { emailsAdded, eventsAdded };
}

/**
 * Sync Google data for all customers with email addresses
 */
export async function syncGoogleDataForAllCustomers(
  userId: number,
  lookbackDays: number = 365
): Promise<{ totalEmails: number; totalEvents: number; customersProcessed: number }> {
  const customers = await db.getCustomersByUserId(userId);
  
  let totalEmails = 0;
  let totalEvents = 0;
  let customersProcessed = 0;

  for (const customer of customers) {
    if (customer.email) {
      try {
        const result = await syncGoogleDataForCustomer(
          userId,
          customer.id,
          customer.email,
          lookbackDays
        );
        totalEmails += result.emailsAdded;
        totalEvents += result.eventsAdded;
        customersProcessed++;
      } catch (error) {
        console.error(`Error syncing customer ${customer.id}:`, error);
      }
    }
  }

  return { totalEmails, totalEvents, customersProcessed };
}
