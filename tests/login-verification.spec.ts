import { test, expect } from '@playwright/test';

test.describe('myOmniDesk Login Verification', () => {
  test('should successfully reuse authenticated session to access the dashboard', async ({ page }) => {
    // Navigate to the dashboard page directly (since storage state is configured)
    await page.goto('/dashboard');

    // Verify that we are on the dashboard and not redirected to login
    await expect(page).toHaveURL(/.*dashboard/);

    // Additionally, verify that the page title contains the expected branding
    await expect(page).toHaveTitle(/myOmniDesk/i);
  });
});
