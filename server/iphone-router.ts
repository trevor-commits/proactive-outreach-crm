import express from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { extractFromIPhoneBackup, processIPhoneData } from './iphone-extractor';
import { createDataSource, getDb, updateDataSource } from './db';
import { sdk } from './_core/sdk';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: '/tmp/iphone-uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
});

/**
 * Upload iPhone backup databases (sms.db and CallHistory.storedata)
 * Expects multipart/form-data with files: smsDb and callHistoryDb
 */
router.post('/upload', upload.fields([
  { name: 'smsDb', maxCount: 1 },
  { name: 'callHistoryDb', maxCount: 1 }
]), async (req, res) => {
  try {
    // Verify authentication
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await getDb();

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.smsDb || files.smsDb.length === 0) {
      return res.status(400).json({ error: 'SMS database file is required' });
    }

    const smsDbPath = files.smsDb[0].path;
    const callHistoryDbPath = files.callHistoryDb?.[0]?.path;

    // Create data source record
    const dataSource = await createDataSource({
      userId: user.id,
      sourceType: 'iphone_backup',
      status: 'in_progress',
      metadata: JSON.stringify({
        uploadedAt: new Date().toISOString(),
        hasSmsDb: true,
        hasCallHistoryDb: !!callHistoryDbPath,
      }),
    });

    try {
      // Extract data from databases
      const extractedData = await extractFromIPhoneBackup(
        user.id,
        smsDbPath,
        callHistoryDbPath
      );

      // Process and match to customers
      const result = await processIPhoneData(
        user.id,
        extractedData.messages,
        extractedData.calls
      );

      // Update data source status
      await updateDataSource(dataSource.id, user.id, {
        status: 'completed',
        lastSyncDate: new Date(),
        metadata: JSON.stringify({
          uploadedAt: new Date().toISOString(),
          messagesExtracted: extractedData.messages.length,
          callsExtracted: extractedData.calls.length,
          matched: result.matched,
          unmatched: result.unmatched,
        }),
      });

      // Clean up uploaded files
      fs.unlinkSync(smsDbPath);
      if (callHistoryDbPath) {
        fs.unlinkSync(callHistoryDbPath);
      }

      res.json({
        success: true,
        messagesExtracted: extractedData.messages.length,
        callsExtracted: extractedData.calls.length,
        matched: result.matched,
        unmatched: result.unmatched,
      });
    } catch (error) {
      // Update data source with error
      await updateDataSource(dataSource.id, user.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      // Clean up uploaded files
      try {
        fs.unlinkSync(smsDbPath);
        if (callHistoryDbPath) {
          fs.unlinkSync(callHistoryDbPath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up files:', cleanupError);
      }

      throw error;
    }
  } catch (error) {
    console.error('iPhone upload error:', error);
    res.status(500).json({
      error: 'Failed to process iPhone backup',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
