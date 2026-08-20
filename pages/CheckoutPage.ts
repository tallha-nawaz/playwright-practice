import { expect, type Locator, type Page } from '@playwright/test';

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly totalLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.postalCodeInput = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.finishButton = page.getByRole('button', { name: 'Finish' });
    this.totalLabel = page.getByTestId('total-label');
  }

  async assertInformationStepIsDisplayed(): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-step-one\.html/);
  }

  async fillCustomerInfo(customer: CustomerInfo): Promise<void> {
    await this.firstNameInput.fill(customer.firstName);
    await this.lastNameInput.fill(customer.lastName);
    await this.postalCodeInput.fill(customer.postalCode);
  }

  async continueToOverview(): Promise<void> {
    await this.continueButton.click();
  }

  async assertOverviewStepIsDisplayed(): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-step-two\.html/);
    await expect(this.totalLabel).toContainText('Total: $');
  }

  async finishOrder(): Promise<void> {
    await this.finishButton.click();
  }
}
