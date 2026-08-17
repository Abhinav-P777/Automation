import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('myOmniDesk Login Verification', () => {

  test('should login successfully and access the dashboard', async ({ page }) => {

    const email = process.env.MYOMNIDESK_EMAIL;
    const password = process.env.MYOMNIDESK_PASSWORD;

    if (!email || !password) {
      throw new Error(
        'MYOMNIDESK_EMAIL and MYOMNIDESK_PASSWORD environment variables must be set.'
      );
    }

    const loginPage = new LoginPage(page);

    // Navigate to login page
    await loginPage.navigate();

    // Enter credentials and sign in
    await loginPage.login(email, password);

    //verify success popup
    await expect(loginPage.successPopup).toBeVisible({
      timeout: 10000
    });

    // Verify successful login
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    await expect(page).toHaveURL(/.*dashboard/);

    // Verify application title
    await expect(page).toHaveTitle(/myOmniDesk/i);

    // Save authenticated session for future tests
    await page.context().storageState({path: 'playwright/.auth/user.json'});
  });
});
