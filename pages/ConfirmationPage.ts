import { expect, type Locator, type Page } from '@playwright/test';

export class ConfirmationPage {
  readonly page: Page;
  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly generatePdfButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.completeHeader = page.getByTestId('complete-header');
    this.completeText = page.getByTestId('complete-text');
    this.generatePdfButton = page.getByTestId('generate-pdf-order');
  }

  async assertOrderIsComplete(): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-complete\.html/);
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
    await expect(this.completeText).toBeVisible();
  }

  /**
   * Triggers SauceDemo's native "Generate PDF order" download and returns the
   * Playwright Download handle so the caller can persist it locally.
   */
  async triggerPdfDownload() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.generatePdfButton.click(),
    ]);
    return download;
  }
}
