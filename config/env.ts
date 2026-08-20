import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

export const env = {
  baseUrl: process.env.SAUCEDEMO_BASE_URL ?? 'https://www.saucedemo.com/',

  googleServiceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
  googleServiceAccountKeyJson: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON,
  googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
};

export function isGoogleDriveConfigured(): boolean {
  const hasCredentials = Boolean(
    env.googleServiceAccountKeyPath || env.googleServiceAccountKeyJson
  );
  return hasCredentials && Boolean(env.googleDriveFolderId);
}
