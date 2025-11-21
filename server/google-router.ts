import express from 'express';
import { getAuthUrl, getTokensFromCode, syncGoogleDataForAllCustomers } from './google-integration';
import { upsertGoogleCredentials, createDataSource, updateDataSource } from './db';
import { sdk } from './_core/sdk';

const router = express.Router();

/**
 * Initiate Google OAuth flow
 */
router.get('/auth', async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authUrl = getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

/**
 * Handle OAuth callback
 */
router.get('/callback', async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      return res.redirect('/?error=unauthorized');
    }

    const code = req.query.code as string;
    if (!code) {
      return res.redirect('/?error=no_code');
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Store credentials
    await upsertGoogleCredentials({
      userId: user.id,
      accessToken: tokens.access_token || null,
      refreshToken: tokens.refresh_token || null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope: tokens.scope || null,
    });

    // Redirect back to app
    res.redirect('/?google_connected=true');
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect('/?error=auth_failed');
  }
});

/**
 * Sync Google data for all customers
 */
router.post('/sync', async (req, res) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const lookbackDays = req.body.lookbackDays || 365;

    // Create data source records
    const gmailSource = await createDataSource({
      userId: user.id,
      sourceType: 'gmail',
      status: 'in_progress',
    });

    const calendarSource = await createDataSource({
      userId: user.id,
      sourceType: 'google_calendar',
      status: 'in_progress',
    });

    try {
      // Sync data
      const result = await syncGoogleDataForAllCustomers(user.id, lookbackDays);

      // Update source statuses
      await updateDataSource(gmailSource.id, user.id, {
        status: 'completed',
        lastSyncDate: new Date(),
        metadata: JSON.stringify({
          emailsAdded: result.totalEmails,
          customersProcessed: result.customersProcessed,
        }),
      });

      await updateDataSource(calendarSource.id, user.id, {
        status: 'completed',
        lastSyncDate: new Date(),
        metadata: JSON.stringify({
          eventsAdded: result.totalEvents,
          customersProcessed: result.customersProcessed,
        }),
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      // Update sources with error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await updateDataSource(gmailSource.id, user.id, {
        status: 'failed',
        errorMessage,
      });

      await updateDataSource(calendarSource.id, user.id, {
        status: 'failed',
        errorMessage,
      });

      throw error;
    }
  } catch (error) {
    console.error('Google sync error:', error);
    res.status(500).json({
      error: 'Failed to sync Google data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
