import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductsPage } from '../pages/ProductsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ConfirmationPage } from '../pages/ConfirmationPage';
import { saveDownloadAsPdf } from '../helpers/pdf';
// Google Drive upload is disabled for now — see the commented step below.
// To re-enable: uncomment these imports and the "Upload the confirmation
// PDF to Google Drive" step, then configure .env per README.md.
// import { uploadPdfToDrive } from '../helpers/googleDrive';
// import { isGoogleDriveConfigured, env } from '../config/env';
import { standardUser, customerInfo, productsToPurchase } from '../test-data/test-data';

const ORDER_PDF_FILE_NAME = 'saucedemo-order.pdf';

test.describe('SauceDemo end-to-end order flow', () => {
  test('logs in, sorts products, checks out, and saves the confirmation PDF locally', async ({ page, browserName }) => {
    // This spec produces one shared PDF artifact. Restricting it to a single
    // browser avoids parallel workers racing on the same output file.
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

    // Google Drive upload — disabled for now, PDF is kept local only.
    // Uncomment to re-enable once .env is configured per README.md.
    // await test.step('Upload the confirmation PDF to Google Drive', async () => {
    //   if (!isGoogleDriveConfigured()) {
    //     test.info().annotations.push({
    //       type: 'skipped',
    //       description:
    //         'Google Drive upload skipped: GOOGLE_SERVICE_ACCOUNT_KEY_PATH/JSON and GOOGLE_DRIVE_FOLDER_ID are not configured. See README.md.',
    //     });
    //     console.warn('[googleDrive] Skipping upload — credentials/folder not configured. See README.md.');
    //     return;
    //   }
    //
    //   const uploadResult = await uploadPdfToDrive(pdfPath, env.googleDriveFolderId as string);
    //   expect(uploadResult.fileId, 'Google Drive should return a file ID for the uploaded PDF').toBeTruthy();
    //   console.log(`[googleDrive] Uploaded order PDF: ${uploadResult.webViewLink}`);
    // });
  });
});
