/**
 * Static test fixtures for the SauceDemo checkout flow.
 * These are public demo credentials/data, safe to keep in source control.
 */
export const standardUser = {
  username: 'standard_user',
  password: 'secret_sauce',
};

export const customerInfo = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: '12345',
};

export const productsToPurchase = [
  'Sauce Labs Bolt T-Shirt',
  'Sauce Labs Bike Light',
] as const;
