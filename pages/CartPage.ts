import { expect, type Locator, type Page } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.getByTestId('inventory-item');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async assertIsDisplayed(): Promise<void> {
    await expect(this.page).toHaveURL(/cart\.html/);
  }

  async assertContainsProducts(productNames: readonly string[]): Promise<void> {
    await expect(this.cartItems).toHaveCount(productNames.length);
    for (const name of productNames) {
      await expect(this.page.getByTestId('inventory-item-name').filter({ hasText: name })).toBeVisible();
    }
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
