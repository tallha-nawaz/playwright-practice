import fs from 'fs';
import path from 'path';
import type { Download } from '@playwright/test';

export const PDF_OUTPUT_DIR = path.resolve(__dirname, '..', 'artifacts');
export async function saveDownloadAsPdf(download: Download, fileName: string): Promise<string> {
  fs.mkdirSync(PDF_OUTPUT_DIR, { recursive: true });
  const destinationPath = path.join(PDF_OUTPUT_DIR, fileName);

  await download.saveAs(destinationPath);

  const fileBuffer = fs.readFileSync(destinationPath);
  const isValidPdf = fileBuffer.length > 0 && fileBuffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (!isValidPdf) {
    throw new Error(`Downloaded file at ${destinationPath} does not look like a valid PDF.`);
  }

  return destinationPath;
}
