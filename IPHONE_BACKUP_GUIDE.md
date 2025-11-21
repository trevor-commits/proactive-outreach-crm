# iPhone Backup Data Extraction Guide

This guide explains how to locate and extract the necessary database files from your iPhone backup on a Mac.

## Prerequisites

- A Mac computer
- iPhone backup created via iTunes/Finder (not iCloud backup)
- Access to your Mac's file system

## Locating Your iPhone Backup

### Step 1: Find the Backup Folder

1. Open **Finder** on your Mac
2. Press `Cmd + Shift + G` to open "Go to Folder"
3. Enter the following path:
   ```
   ~/Library/Application Support/MobileSync/Backup/
   ```
4. Press **Enter**

You should see one or more folders with long alphanumeric names (e.g., `00008030-001234567890ABCD`). Each folder represents a backup of a device.

### Step 2: Identify the Correct Backup

If you have multiple backups:

1. Right-click on a backup folder
2. Select **Get Info**
3. Check the **Modified** date to find the most recent backup
4. Or check the device name in the backup's `Info.plist` file

## Extracting Database Files

The iPhone backup stores files with hashed filenames. You need to locate two specific database files:

### Option 1: Using Finder Search (Recommended)

1. Open the backup folder (the one with the long alphanumeric name)
2. Press `Cmd + F` to search
3. Search for files containing: `sms.db`
4. Copy the file named exactly `3d0d7e5fb2ce288813306e4d4636395e047a3d28` (this is the SMS database)
5. Rename it to `sms.db`

For call history:
1. Search for: `CallHistory`
2. Copy the file named `2b2b0084a1bc3a5ac8c27afdf14afb42c61a19ca`
3. Rename it to `CallHistory.storedata`

### Option 2: Using Terminal (Advanced)

```bash
# Navigate to your backup folder
cd ~/Library/Application\ Support/MobileSync/Backup/YOUR_BACKUP_ID/

# Find and copy SMS database
find . -name "*sms.db*" -exec cp {} ~/Desktop/sms.db \;

# Find and copy call history
find . -name "*CallHistory*" -exec cp {} ~/Desktop/CallHistory.storedata \;
```

### Known File Hashes

These are the standard hashed filenames for iPhone backup files:

- **SMS Database**: `3d0d7e5fb2ce288813306e4d4636395e047a3d28`
- **Call History**: `2b2b0084a1bc3a5ac8c27afdf14afb42c61a19ca`

## File Descriptions

### sms.db

- **Contains**: All SMS and iMessage conversations
- **Tables Used**:
  - `message` - Message content, timestamps, and metadata
  - `handle` - Phone numbers and contact identifiers
  - `chat_message_join` - Links messages to conversations

### CallHistory.storedata

- **Contains**: Complete call history
- **Tables Used**:
  - `ZCALLRECORD` - Call records with duration, direction, and timestamps

## Data Extracted

### From SMS Database

- **Message text**: The actual message content
- **Phone number**: Sender/recipient phone number
- **Timestamp**: When the message was sent/received
- **Direction**: Incoming (received) or outgoing (sent)

### From Call History Database

- **Phone number**: The number called or that called you
- **Call duration**: Length of the call in seconds
- **Timestamp**: When the call occurred
- **Direction**: Incoming, outgoing, or missed

## Privacy & Security

**Important Notes:**

1. **Sensitive Data**: These database files contain your complete message and call history. Handle them securely.

2. **Local Processing**: The CRM application processes these files locally and only stores:
   - Phone numbers (normalized)
   - Interaction dates
   - Interaction types (call/SMS)
   - Direction (incoming/outgoing)
   - Message content is NOT stored permanently

3. **Encryption**: iPhone backups may be encrypted. If prompted for a password, use your backup encryption password.

4. **Backup First**: Always keep a copy of your original backup files before uploading.

## Troubleshooting

### "File not found"

- Ensure you have a local iTunes/Finder backup (not iCloud)
- Create a new backup if needed:
  1. Connect iPhone to Mac
  2. Open Finder
  3. Select your iPhone
  4. Click "Back Up Now"

### "Permission denied"

```bash
# Grant Terminal full disk access
System Settings > Privacy & Security > Full Disk Access > Add Terminal
```

### "Database is encrypted"

- Your iPhone backup is encrypted
- You'll need the backup password to decrypt
- Consider creating a new unencrypted backup for this purpose

### "Wrong file format"

- Ensure you're copying the actual database files, not shortcuts
- Verify file sizes:
  - `sms.db` is typically 10-100 MB
  - `CallHistory.storedata` is typically 1-10 MB

## Upload Process

Once you have the files:

1. Navigate to the **Import Data** page in the CRM
2. Click **Choose File** for SMS Database
3. Select your `sms.db` file
4. (Optional) Click **Choose File** for Call History
5. Select your `CallHistory.storedata` file
6. Click **Upload iPhone Data**
7. Wait for processing (may take 1-2 minutes for large databases)
8. Review the import results

## What Happens During Import

1. **Database Parsing**: SQLite databases are opened and queried
2. **Data Extraction**: Messages and calls are extracted with timestamps
3. **Phone Normalization**: Numbers are converted to E.164 format (+14155551234)
4. **Customer Matching**: Phone numbers are matched against your customer database
5. **Storage**: Matched interactions are linked to customers
6. **Unmatched Handling**: Unmatched interactions are stored for manual review

## Expected Results

After import, you should see:

- **Matched Interactions**: Interactions linked to existing customers
- **Unmatched Interactions**: Interactions from unknown numbers
- **Import Summary**: Count of messages, calls, and matches

Example:
```
iPhone data imported: 245 matched, 67 unmatched
- 180 SMS messages
- 65 phone calls
- 245 matched to existing customers
- 67 from unknown contacts
```

## Next Steps

1. Review unmatched interactions
2. Create customer records for unknown contacts
3. Re-import to link previously unmatched data
4. Check customer detail pages for complete interaction timelines

## Alternative: Using Third-Party Tools

If you prefer a GUI tool:

- **iMazing**: Commercial iPhone backup browser
- **iBackup Viewer**: Free iPhone backup viewer
- **DB Browser for SQLite**: Open-source database viewer

These tools can help you explore the backup structure and export specific files.

## Support

For technical issues with file extraction, consult:
- Apple Support: https://support.apple.com/iphone-backups
- This project's README.md for application-specific questions
