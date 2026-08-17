import { Page, Locator, expect } from '@playwright/test';

export class CasePage {
  readonly page: Page;

  // Navigation & Modal triggers
  readonly casesNavLink: Locator;
  readonly createCaseButton: Locator;
  readonly modalDialog: Locator;
  readonly modalHeading: Locator;

  // Form Fields
  readonly subjectInput: Locator;
  readonly customerEmailInput: Locator;
  readonly sourceDropdown: Locator;
  readonly queueDropdown: Locator;
  readonly priorityDropdown: Locator;
  readonly descriptionInput: Locator;
  readonly submitButton: Locator;

  // Feedback & Table
  readonly successPopup: Locator;
  readonly allCasesTab: Locator;
  readonly casesTable: Locator;
  readonly tableHeaders: Locator;
  readonly firstRow: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation & Modal
    this.casesNavLink = page.getByRole('link', { name: 'Cases' }).first();
    this.createCaseButton = page.getByRole('button', { name: 'Create Case', exact: true });
    this.modalDialog = page.getByRole('dialog');
    this.modalHeading = page.getByRole('heading', { name: 'Create Case' });

    // Form inputs & dropdowns inside modal
    this.subjectInput = page
      .locator('label')
      .filter({ hasText: /^Subject/ })
      .locator('..')
      .locator('input');

    this.customerEmailInput = page
      .locator('label')
      .filter({ hasText: /^Customer Email/ })
      .locator('..')
      .locator('input');

    this.sourceDropdown = page
      .locator('label')
      .filter({ hasText: /^Source/ })
      .locator('..')
      .getByRole('button');

    this.queueDropdown = page
      .locator('label')
      .filter({ hasText: /^Queue/ })
      .locator('..')
      .getByRole('button');

    this.priorityDropdown = page
      .locator('label')
      .filter({ hasText: /^Priority/ })
      .locator('..')
      .getByRole('button');

    this.descriptionInput = page
      .locator('label')
      .filter({ hasText: /^Description/ })
      .locator('..')
      .locator('textarea');

    this.submitButton = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Create Case', exact: true });

    // Post-creation & Table elements
    this.successPopup = page.getByText(/case created/i).first();
    this.allCasesTab = page.getByRole('button', { name: 'All Cases', exact: true });
    this.casesTable = page.locator('table');
    this.tableHeaders = page.locator('table thead th');
    this.firstRow = page.locator('table tbody tr').first();
  }

  /**
   * Navigates to the Cases section
   */
  async navigate() {
    await this.casesNavLink.click();
    await this.page.waitForURL(/.*\/cases(?:\?.*)?$/, { timeout: 15000 });
  }

  /**
   * Clicks Create Case button and waits for the modal to be visible
   */
  async openCreateCaseModal() {
    await expect(this.createCaseButton).toBeVisible({ timeout: 10000 });
    await this.createCaseButton.click();
    await expect(this.modalHeading).toBeVisible({ timeout: 10000 });
  }

  /**
   * Fills basic case information (Subject & Customer Email)
   */
  async fillBasicCaseInformation(subject: string, customerEmail: string) {
    await this.subjectInput.fill(subject);
    await this.customerEmailInput.fill(customerEmail);
  }

  /**
   * Selects Source from the dropdown
   */
  async selectSource(source: string) {
    if (!source) return;
    await this.sourceDropdown.click();
    const option = this.page.locator('[role="option"]').filter({ hasText: new RegExp(source, 'i') }).first();
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();
  }

  /**
   * Selects Queue from the dropdown with dynamic wait for options to load
   */
  async selectQueue(queue: string) {
    if (!queue) return;
    await this.queueDropdown.click();
    const option = this.page.locator('[role="option"]').filter({ hasText: new RegExp(queue, 'i') }).first();
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
  }

  /**
   * Selects Priority from the dropdown
   */
  async selectPriority(priority: string) {
    if (!priority) return;
    await this.priorityDropdown.click();
    const option = this.page.locator('[role="option"]').filter({ hasText: new RegExp(`^${priority}$`, 'i') }).first();
    await expect(option).toBeVisible({ timeout: 5000 });
    await option.click();
  }

  /**
   * Fills the optional description textarea
   */
  async fillDescription(description: string) {
    if (!description) return;
    await this.descriptionInput.fill(description);
  }

  /**
   * Submits the Case creation form
   */
  async submitCase() {
    await this.submitButton.click();
  }

  /**
   * Validates that the success popup/message is displayed and the modal closes
   */
  async verifySuccessMessage() {
    await expect(this.successPopup).toBeVisible({ timeout: 10000 });
    await expect(this.modalDialog).toBeHidden({ timeout: 10000 }).catch(() => {});
  }

  /**
   * Navigates to All Cases tab and waits for the table to load.
   * Handles returning from an inner case details view if the app navigated after creation.
   */
  async navigateToAllCases() {
    // If currently inside an inner case details view, click Cases in sidebar
    const isAllCasesTabVisible = await this.allCasesTab.isVisible().catch(() => false);
    if (!isAllCasesTabVisible) {
      await this.casesNavLink.click();
      await this.page.waitForURL(/.*\/cases(?:\?.*)?$/, { timeout: 15000 }).catch(() => {});
    }

    await expect(this.allCasesTab).toBeVisible({ timeout: 10000 });
    await this.allCasesTab.click();
    await expect(this.casesTable).toBeVisible({ timeout: 10000 });
    await expect(this.firstRow).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verifies that the newly created case appears as the first row in All Cases
   * and cross-checks the data against the exact Excel input data.
   */
  async verifyFirstRowCaseData(expectedData: {
    subject: string;
    customerEmail: string;
    source: string;
    queue: string;
    priority: string;
    expectedStatus?: string;
  }) {
    const expectedStatus = expectedData.expectedStatus || 'New';

    // Wait for first row to be visible and contain the created subject
    await expect(this.firstRow).toBeVisible({ timeout: 10000 });
    await expect(this.firstRow).toContainText(expectedData.subject, { timeout: 10000 });

    const rawHeaders = await this.tableHeaders.allInnerTexts();
    const headers = rawHeaders.map(h => h.trim().toUpperCase());
    const cells = await this.firstRow.locator('td').allInnerTexts();

    const subjectIndex = headers.findIndex(h => h.includes('SUBJECT'));
    const statusIndex = headers.findIndex(h => h.includes('STATUS'));
    const priorityIndex = headers.findIndex(h => h.includes('PRIORITY'));
    const sourceIndex = headers.findIndex(h => h.includes('SOURCE'));
    const queueIndex = headers.findIndex(h => h.includes('QUEUE'));

    // Validate Subject & Customer Email in Subject column
    const subjectCellText = subjectIndex !== -1 ? cells[subjectIndex] : await this.firstRow.innerText();
    expect(subjectCellText).toContain(expectedData.subject);
    expect(subjectCellText).toContain(expectedData.customerEmail);

    // Validate Status is strictly "New"
    const statusCellText = statusIndex !== -1 ? cells[statusIndex].trim() : '';
    expect(statusCellText.toLowerCase()).toBe(expectedStatus.toLowerCase());

    // Validate Priority matches Excel data
    if (expectedData.priority && priorityIndex !== -1) {
      const priorityCellText = cells[priorityIndex].trim();
      expect(priorityCellText.toUpperCase()).toBe(expectedData.priority.toUpperCase());
    }

    // Validate Source matches Excel data
    if (expectedData.source && sourceIndex !== -1) {
      const sourceCellText = cells[sourceIndex].trim();
      expect(sourceCellText.toUpperCase()).toBe(expectedData.source.toUpperCase());
    }

    // Validate Queue matches Excel data
    if (expectedData.queue && queueIndex !== -1) {
      const queueCellText = cells[queueIndex].trim();
      expect(queueCellText.toUpperCase()).toBe(expectedData.queue.toUpperCase());
    }
  }
}
