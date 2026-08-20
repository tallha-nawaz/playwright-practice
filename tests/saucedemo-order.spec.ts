import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ConfirmationPage } from '../pages/ConfirmationPage';
import { saveDownloadAsPdf } from '../helpers/pdf';
import { standardUser, customerInfo, productsToPurchase } from '../test-data/test-data';

const ORDER_PDF_FILE_NAME = 'saucedemo-order.pdf';

test.describe('SauceDemo end-to-end order flow', () => {
  test('logs in, sorts products, checks out, and saves the confirmation PDF locally', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Order/PDF flow runs once, on Chromium only.');

    const loginPage = new LoginPage(page);
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const confirmationPage = new ConfirmationPage(page);

    await test.step('Log in with standard user credentials', async () => {
      await loginPage.goto();
      await loginPage.login(standardUser.username, standardUser.password);
      await productsPage.assertIsDisplayed();
    });

    await test.step('Sort products by price, low to high', async () => {
      await productsPage.sortBy('Price (low to high)');
    });

    await test.step('Add the target products to the cart', async () => {
      for (const productName of productsToPurchase) {
        await productsPage.addProductToCart(productName);
      }
      await productsPage.assertCartItemCount(productsToPurchase.length);
    });

    await test.step('Verify the cart contains both selected products', async () => {
      await productsPage.openCart();
      await cartPage.assertIsDisplayed();
      await cartPage.assertContainsProducts(productsToPurchase);
    });

    await test.step('Complete checkout with customer information', async () => {
      await cartPage.proceedToCheckout();
      await checkoutPage.assertInformationStepIsDisplayed();
      await checkoutPage.fillCustomerInfo(customerInfo);
      await checkoutPage.continueToOverview();
      await checkoutPage.assertOverviewStepIsDisplayed();
      await checkoutPage.finishOrder();
    });

    await test.step('Verify the order confirmation page', async () => {
      await confirmationPage.assertOrderIsComplete();
    });

    const pdfPath = await test.step('Generate and save the order confirmation PDF', async () => {
      const download = await confirmationPage.triggerPdfDownload();
      const savedPath = await saveDownloadAsPdf(download, ORDER_PDF_FILE_NAME);
      await test.info().attach(ORDER_PDF_FILE_NAME, { path: savedPath, contentType: 'application/pdf' });
      return savedPath;
    });

    console.log(`[pdf] Order confirmation saved locally at: ${pdfPath}`);
  });
});
