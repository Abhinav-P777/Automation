import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // We use the reliable selectors identified during inspection
    this.emailInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
  }

  /**
   * Navigates to the login page
   */
  async navigate() {
    await this.page.goto('/login');
  }

  /**
   * Fills in credentials and clicks Sign In
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
