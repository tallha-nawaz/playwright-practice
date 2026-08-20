import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

/**
 * Centralized, typed access to environment configuration.
 * Google Drive credentials are never hard-coded — they must be supplied
 * via environment variables (or a local, git-ignored .env file).
 */
export const env = {
  baseUrl: process.env.SAUCEDEMO_BASE_URL ?? 'https://www.saucedemo.com/',

  googleServiceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
  googleServiceAccountKeyJson: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON,
  googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
};

/**
 * True only when enough configuration is present to attempt a Drive upload.
 * A service account can be supplied either as a path to a key file or as
 * the raw JSON contents (useful for CI secrets).
 */
export function isGoogleDriveConfigured(): boolean {
  const hasCredentials = Boolean(
    env.googleServiceAccountKeyPath || env.googleServiceAccountKeyJson
  );
  return hasCredentials && Boolean(env.googleDriveFolderId);
}
