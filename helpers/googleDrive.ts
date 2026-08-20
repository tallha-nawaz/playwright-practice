import fs from 'fs';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import { env } from '../config/env';

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
}

/**
 * Builds an authenticated Drive client from a service account.
 * Credentials come exclusively from environment configuration — either a
 * path to a key file (GOOGLE_SERVICE_ACCOUNT_KEY_PATH) or the raw key JSON
 * (GOOGLE_SERVICE_ACCOUNT_KEY_JSON, handy for CI secrets). Never hard-coded.
 */
function buildDriveClient() {
  if (env.googleServiceAccountKeyJson) {
    const credentials = JSON.parse(env.googleServiceAccountKeyJson);
    const auth = new GoogleAuth({ credentials, scopes: DRIVE_SCOPES });
    return google.drive({ version: 'v3', auth: auth as unknown as Parameters<typeof google.drive>[0]['auth'] });
  }

  if (env.googleServiceAccountKeyPath) {
    if (!fs.existsSync(env.googleServiceAccountKeyPath)) {
      throw new Error(
        `GOOGLE_SERVICE_ACCOUNT_KEY_PATH points to a file that does not exist: ${env.googleServiceAccountKeyPath}`
      );
    }
    const auth = new GoogleAuth({ keyFile: env.googleServiceAccountKeyPath, scopes: DRIVE_SCOPES });
    return google.drive({ version: 'v3', auth: auth as unknown as Parameters<typeof google.drive>[0]['auth'] });
  }

  throw new Error(
    'No Google service account credentials configured. Set GOOGLE_SERVICE_ACCOUNT_KEY_PATH or GOOGLE_SERVICE_ACCOUNT_KEY_JSON.'
  );
}

/**
 * Uploads a local PDF file to the configured Google Drive folder and
 * verifies the upload by re-fetching the created file's metadata.
 * Works for both "My Drive" folders (shared with the service account
 * email) and Shared Drive folders (supportsAllDrives: true).
 */
export async function uploadPdfToDrive(filePath: string, folderId: string): Promise<DriveUploadResult> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Cannot upload to Google Drive: file not found at ${filePath}`);
  }

  const drive = buildDriveClient();
  const fileName = filePath.split(/[\\/]/).pop() as string;

  const createResponse = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: 'application/pdf',
      body: fs.createReadStream(filePath),
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });

  const fileId = createResponse.data.id;
  if (!fileId) {
    throw new Error('Google Drive upload did not return a file ID.');
  }

  // Verify the file actually exists on Drive before declaring success.
  const verifyResponse = await drive.files.get({
    fileId,
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });

  if (verifyResponse.data.id !== fileId) {
    throw new Error('Google Drive upload verification failed: file could not be re-fetched.');
  }

  return {
    fileId,
    webViewLink: verifyResponse.data.webViewLink ?? '',
  };
}
