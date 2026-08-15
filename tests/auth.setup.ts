import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const email = process.env.MYOMNIDESK_EMAIL;
  const password = process.env.MYOMNIDESK_PASSWORD;

  if (!email || !password) {
    throw new Error('MYOMNIDESK_EMAIL and MYOMNIDESK_PASSWORD environment variables must be set.');
  }

  const loginPage = new LoginPage(page);

  // Navigate to login page
  await loginPage.navigate();

  // Log in using environment credentials
  await loginPage.login(email, password);

  // Wait until the page redirects to the dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  // Verify we are on the dashboard page
  await expect(page).toHaveURL(/.*dashboard/);

  // Save the storage state
  await page.context().storageState({ path: authFile });
});
