import { expect, type Locator, type Page } from '@playwright/test';

export type SortOption = 'Name (A to Z)' | 'Name (Z to A)' | 'Price (low to high)' | 'Price (high to low)';

const SORT_OPTION_VALUES: Record<SortOption, string> = {
  'Name (A to Z)': 'az',
  'Name (Z to A)': 'za',
  'Price (low to high)': 'lohi',
  'Price (high to low)': 'hilo',
};

export class ProductsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly sortDropdown: Locator;
  readonly cartLink: Locator;
  readonly inventoryItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByTestId('title');
    this.sortDropdown = page.getByRole('combobox');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.inventoryItems = page.locator('.inventory_item');
  }

  async assertIsDisplayed(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory\.html/);
    await expect(this.pageTitle).toHaveText('Products');
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption({ label: option });
    await expect(this.sortDropdown).toHaveValue(SORT_OPTION_VALUES[option]);
  }

  private productContainer(productName: string): Locator {
    return this.inventoryItems.filter({ hasText: productName });
  }

  async addProductToCart(productName: string): Promise<void> {
    const addButton = this.productContainer(productName).getByRole('button', { name: 'Add to cart' });
    await addButton.click();
    await expect(this.productContainer(productName).getByRole('button', { name: 'Remove' })).toBeVisible();
  }

  async assertCartItemCount(expectedCount: number): Promise<void> {
    await expect(this.page.getByTestId('shopping-cart-badge')).toHaveText(String(expectedCount));
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
