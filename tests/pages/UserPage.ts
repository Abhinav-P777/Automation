import { Page, Locator, expect } from '@playwright/test';

export class UserPage {
  readonly page: Page;

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly systemRole: Locator;
  readonly phoneInput: Locator;
  readonly location: Locator;
  readonly department: Locator;
  readonly group: Locator;
  readonly managers: Locator;
  readonly routingProfile: Locator;
  readonly securityProfiles: Locator;
  readonly extensionNumber: Locator;
  readonly caseQueues: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.emailInput = page.locator('input[name="email"]');
    this.systemRole = page
      .locator('label')
      .filter({ hasText: 'System Role' })
      .locator('..')
      .getByRole('button');

    this.phoneInput = page.locator('input[type="tel"]');
    this.location = page
      .locator('label')
      .filter({ hasText: 'Location' })
      .locator('..')
      .getByRole('button');

    this.department = page
      .locator('label')
      .filter({ hasText: 'Department' })
      .locator('..')
      .getByRole('button');

    this.group = page
      .locator('label')
      .filter({ hasText: 'Group' })
      .locator('..')
      .getByRole('button');

    this.managers = page
      .locator('label')
      .filter({ hasText: 'Managers' })
      .locator('..')
      .getByRole('button');

    this.routingProfile = page
      .locator('label')
      .filter({ hasText: 'Routing Profile' })
      .locator('..')
      .getByRole('button');

    this.securityProfiles = page
      .locator('label')
      .filter({ hasText: 'Security Profiles' })
      .locator('..')
      .getByRole('button');

    this.extensionNumber = page.locator('input[name="extensionNumber"]');

    this.caseQueues = page
      .locator('label')
      .filter({ hasText: 'Case Queues' })
      .locator('..')
      .getByRole('button');
    this.createButton = page.getByRole('button', { name: /create|save/i });
  }

  async navigate() {
    // Admin Dashboard → Admin Portal
    await this.page.getByRole('link', { name: 'Admin Portal' }).click();

    // Admin Portal → User Management
    await this.page.getByRole('link', { name: 'Manage Users →' }).click();

    // User Management → Create User
    await this.page.getByRole('link', { name: 'Add User →' }).click();
  }

  async fillBasicInformation(
    firstName: string,
    lastName: string,
    email: string,
    phone: string
  ) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.fill(email);
    await this.phoneInput.fill(phone);
  }

  async selectSystemRole(role: string) {
    await this.systemRole.click();

    await this.page
      .getByRole('option', {
        name: role,
        exact: true
      })
      .click();
  }

  async selectLocation(location: string) {
    await this.location.click();
    await this.page.getByText(location, { exact: true }).click();
  }

  async selectDepartment(department: string) {
    await this.department.click();
    await this.page.getByText(department, { exact: true }).click();
  }

  async selectGroup(group: string) {
    if (!group) return;

    await this.group.click();
    await this.page.getByText(group, { exact: true }).click();
  }

  async selectManager(manager: string) {
    if (!manager) return;

    await this.managers.click();
    await this.page.getByText(manager, { exact: true }).last().click();

    // Close the multi-select dropdown
    await this.page.keyboard.press('Escape');
  }

  async selectRoutingProfile(profile: string) {
    if (!profile) return;

    await this.routingProfile.click();
    await this.page.getByText(profile, { exact: true }).last().click();
    await this.page.keyboard.press('Escape');
  }

  async selectSecurityProfile(profile: string) {
    if (!profile) {
      throw new Error('Security Profile is empty in Excel');
    }

    await this.securityProfiles.click();

    await this.page.getByText(profile, { exact: true }).last().click();

    await this.page.keyboard.press('Escape');
  }

  async fillExtensionNumber(extension: string) {
    if (!extension) return;

    await this.extensionNumber.fill(extension);
  }

  async selectCaseQueue(queue: string) {
    if (!queue) return;

    await this.caseQueues.click();
    await this.page.getByText(queue, { exact: true }).last().click();

    // Close the Case Queues dropdown
    await this.page.keyboard.press('Escape');
  }

  /**
   * Customizes permission checkboxes for a selected case queue row.
   * @param permissions List of permission names to check (e.g. ['View', 'Create', 'Edit Own'])
   * @param queueName Optional queue name to target the specific queue row
   */
  async customizeCaseQueuePermissions(permissions: string[], queueName?: string) {
    if (!permissions || permissions.length === 0) {
      return;
    }

    // 1. Locate the specific Queue row displayed below the dropdown
    let queueRow: Locator;
    if (queueName) {
      queueRow = this.page
        .locator('div')
        .filter({
          has: this.page.locator('span').filter({ hasText: new RegExp(`^${queueName}$`) })
        })
        .filter({
          has: this.page
            .getByRole('button', { name: /customize/i })
            .or(this.page.getByText('Customize', { exact: true }))
        })
        .last();
    } else {
      queueRow = this.page
        .locator('div')
        .filter({
          has: this.page
            .getByRole('button', { name: /customize/i })
            .or(this.page.getByText('Customize', { exact: true }))
        })
        .last();
    }

    // 2. Click Customize button within the queue row
    const customizeBtn = queueRow
      .getByRole('button', { name: /customize/i })
      .or(queueRow.getByText('Customize', { exact: true }))
      .first();

    await expect(customizeBtn).toBeVisible({ timeout: 10000 });
    await customizeBtn.click();

    // 3. Locate the permissions section
    const permissionsContainer = this.page
      .locator('div')
      .filter({
        has: this.page.locator('label').filter({ hasText: 'View' })
      })
      .last();

    await expect(permissionsContainer).toBeVisible({ timeout: 10000 });

    const availablePermissions = [
      'View',
      'Create',
      'Edit Own',
      'Edit All',
      'Pick Up',
      'Assign Others',
      'Auto-Assignable',
      'Transfer (Any Queue)',
      'Transfer (Parent Only)',
      'Change Status',
      'Reopen'
    ];

    const normalizedRequested = permissions.map(p => p.trim()).filter(Boolean);

    // Validate that all requested permissions are valid
    for (const req of normalizedRequested) {
      const exists = availablePermissions.some(
        avail => avail.toLowerCase() === req.toLowerCase()
      );
      if (!exists) {
        throw new Error(
          `Invalid permission "${req}" specified in Excel. Available permissions: ${availablePermissions.join(', ')}`
        );
      }
    }

    // 4. Check only the requested permissions, uncheck the rest
    for (const available of availablePermissions) {
      const checkboxLabel = permissionsContainer
        .locator('label')
        .filter({
          hasText: new RegExp(
            `^${available.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
            'i'
          )
        })
        .first();

      const checkbox = checkboxLabel.locator('input[type="checkbox"]');
      const isRequested = normalizedRequested.some(
        req => req.toLowerCase() === available.toLowerCase()
      );

      const isChecked = await checkbox.isChecked();

      if (isRequested && !isChecked) {
        await checkbox.check();
      } else if (!isRequested && isChecked) {
        await checkbox.uncheck();
      }
    }

    // 5. Verify that all requested permissions are checked
    for (const req of normalizedRequested) {
      const checkboxLabel = permissionsContainer
        .locator('label')
        .filter({
          hasText: new RegExp(
            `^${req.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
            'i'
          )
        })
        .first();

      const checkbox = checkboxLabel.locator('input[type="checkbox"]');
      await expect(checkbox).toBeChecked();
    }

    console.log(`Selected queue permissions: ${normalizedRequested.join(', ')}`);
  }

  // async createUser() {
  //   await this.createButton.click();
  // }
}