# SauceDemo Order Automation

A Playwright + TypeScript automation that runs a full purchase flow on
[saucedemo.com](https://www.saucedemo.com/), captures the order confirmation
as a PDF, and uploads that PDF to Google Drive. Built as a learning example
of a clean Playwright project structure (Page Object Model, reusable
helpers, environment-based configuration).

## What the test does

1. Logs in with the standard SauceDemo user and verifies the products page.
2. Sorts products by **Price (low to high)**.
3. Adds **Sauce Labs Bolt T-Shirt** and **Sauce Labs Bike Light** to the cart.
4. Opens the cart and verifies both products are present.
5. Checks out with customer info (`John` / `Doe` / `12345`).
6. Verifies the order confirmation page and message.
7. Uses SauceDemo's built-in "Generate PDF order" button (captured via
   Playwright's `download` event) to produce a real PDF of the completed
   order, saved to `artifacts/saucedemo-order.pdf`.

> **Google Drive upload is currently disabled.** The test only saves the PDF
> locally for now. The upload step and its imports are commented out in
> [`tests/saucedemo-order.spec.ts`](tests/saucedemo-order.spec.ts) — the
> `helpers/googleDrive.ts` module is still implemented, so re-enabling it is
> just a matter of uncommenting that step once `.env` is configured (see
> below).

Each step has an explicit assertion, so a failure at any stage points
directly at what broke.

## Project structure

```
config/           Environment/config loading (dotenv, typed env, Drive config check)
pages/             Page Object Model classes (Login, Products, Cart, Checkout, Confirmation)
helpers/           Reusable logic: PDF saving/validation, Google Drive upload
test-data/         Static test fixtures (credentials, customer info, product names)
tests/             The Playwright spec that composes the above into the full flow
artifacts/         Generated PDFs land here (git-ignored)
```

## 1. Install dependencies

```bash
npm install
npx playwright install
```

## 2. Configure Google Drive credentials

The Drive upload never uses hard-coded secrets — it reads from environment
variables, loaded from a local `.env` file (git-ignored).

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Create a Google Cloud service account with the **Drive API** enabled:
   - Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs &
     Services → Enable "Google Drive API" for your project.
   - IAM & Admin → Service Accounts → Create a service account.
   - Create a JSON key for it and download the file (e.g.
     `google-service-account.json`). Keep it out of version control — it's
     already covered by `.gitignore`.

3. Share a destination folder with the service account:
   - Open (or create) a folder in Google Drive (a personal "My Drive" folder
     or a Shared Drive folder both work).
   - Share it with the service account's email address (looks like
     `name@project-id.iam.gserviceaccount.com`, found in the JSON key file),
     giving it **Editor** access.
   - Copy the folder ID from its URL:
     `https://drive.google.com/drive/folders/<FOLDER_ID>`.

4. Fill in `.env`:

   ```dotenv
   GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./google-service-account.json
   GOOGLE_DRIVE_FOLDER_ID=<FOLDER_ID>
   ```

   In CI, prefer passing the key as a secret instead of a file: set
   `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` to the full JSON contents and leave
   `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` unset.

If Drive isn't configured, the test still runs and passes — the upload step
is skipped with a console warning and a test annotation, so you can exercise
the SauceDemo flow and PDF generation without Google credentials.

## 3. Run the test

```bash
npm test              # headless, runs the order flow on Chromium
npm run test:headed   # same, with a visible browser
npm run test:ui       # Playwright's interactive UI mode
```

The spec runs once, on Chromium only (by design — it produces one shared PDF
and one Drive upload per run, so it's pinned to a single browser to avoid
parallel workers racing on the same output file).

## 4. Find the generated PDF

After a run, the PDF is at:

```
artifacts/saucedemo-order.pdf
```

It's also attached to the Playwright HTML report — run `npm run report` and
open the test to view/download it from there.

## 5. Verify the Google Drive upload

- The test log prints `[googleDrive] Uploaded order PDF: <link>` with a
  direct Google Drive link on success.
- Open the destination folder in Google Drive and confirm
  `saucedemo-order.pdf` appears there.
- The test itself asserts that Drive returned a file ID and that the file
  can be re-fetched by that ID before considering the upload successful —
  if the upload silently failed, the test would fail too.

## Notes on locator strategy

Locators favor accessible roles, labels, and (SauceDemo's site-wide)
`data-test` attributes over brittle CSS/XPath, e.g.
`page.getByRole('button', { name: 'Add to cart' })` scoped to a product
container found by name, `page.getByPlaceholder('First Name')`, and
`page.getByTestId(...)` (the project configures `testIdAttribute: 'data-test'`
in `playwright.config.ts` to match SauceDemo's markup).
