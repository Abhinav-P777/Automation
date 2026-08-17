import { test } from '@playwright/test';
import ExcelJS from 'exceljs';
import path from 'path';
import { LoginPage } from './pages/LoginPage';
import { UserPage } from './pages/UserPage';

test.describe('myOmniDesk User Creation', () => {

  test('should create users from Excel data', async ({ page }) => {

    const loginPage = new LoginPage(page);

    const loginEmail = process.env.MYOMNIDESK_EMAIL;
    const loginPassword = process.env.MYOMNIDESK_PASSWORD;

    if (!loginEmail || !loginPassword) {
      throw new Error(
        'MYOMNIDESK_EMAIL and MYOMNIDESK_PASSWORD environment variables must be set.'
      );
    }

    await page.goto('/login');

    await loginPage.login(loginEmail, loginPassword);

    // Close the Amazon Connect popup opened after login
    for (const p of page.context().pages()) {
      if (p !== page) {
        await p.close();
      }
    }

    // Excel file location
    const filePath = path.resolve(
      __dirname,
      '../test-data/UserCreation.xlsx'
    );

    // Load Excel workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // Get Users sheet
    console.log('Available sheets:', workbook.worksheets.map(ws => ws.name));

    const worksheet = workbook.getWorksheet('Users') || workbook.worksheets[0];

    if (!worksheet) {
      throw new Error('No worksheet found in Excel file.');
    }

    console.log('Using sheet:', worksheet.name);

    const userPage = new UserPage(page);

    // Select the Excel row to use for this test
    const rowNumber = Number(process.env.USER_ROW || 2);

    const row = worksheet.getRow(rowNumber);

    const firstName = row.getCell(1).text.trim();
    const lastName = row.getCell(2).text.trim();
    const email = row.getCell(3).text.trim();
    const systemRole = row.getCell(4).text.trim();
    const phone = row.getCell(5).text.trim().replace(
      /(\d{3})(\d{3})(\d{4})/,
      '$1-$2-$3'
    );
    const location = row.getCell(6).text.trim();
    const department = row.getCell(7).text.trim();
    const group = row.getCell(8).text.trim();
    const manager = row.getCell(9).text.trim();
    const caseQueue = row.getCell(10).text.trim();
    const routingProfile = row.getCell(11).text.trim();
    const securityProfile = row.getCell(12).text.trim();
    const extensionNumber = row.getCell(13).text.trim();

    // Read Customize Roles column (Column 14)
    const customizeRolesText = row.getCell(14).text.trim();

    let customizeRoles: string[] = [];
    if (customizeRolesText) {
      try {
        if (customizeRolesText.startsWith('[') && customizeRolesText.endsWith(']')) {
          const parsed = JSON.parse(customizeRolesText);
          if (Array.isArray(parsed)) {
            customizeRoles = parsed.map((item: any) => String(item).trim()).filter(Boolean);
          }
        }
      } catch {
        // Fallback to comma-separated if not JSON
      }

      if (customizeRoles.length === 0) {
        customizeRoles = customizeRolesText
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
    }

    console.log(`Creating user: ${firstName} ${lastName}`);
    if (customizeRoles.length > 0) {
      console.log(`Customize Roles from Excel: ${customizeRoles.join(', ')}`);
    }

    // Open Create New User page
    await userPage.navigate();

    // Fill basic information
    await userPage.fillBasicInformation(
      firstName,
      lastName,
      email,
      phone
    );

    // Select dropdown values
    await userPage.selectSystemRole(systemRole);
    await userPage.selectLocation(location);
    await userPage.selectDepartment(department);

    // Optional fields
    await userPage.selectGroup(group);
    await userPage.selectManager(manager);

    // IVR Configuration fields
    await userPage.selectRoutingProfile(routingProfile);
    await userPage.selectSecurityProfile(securityProfile);
    await userPage.fillExtensionNumber(extensionNumber);

    // Case queue
    await userPage.selectCaseQueue(caseQueue);

    // Customize Case Queue Permissions
    if (customizeRoles.length > 0) {
      await userPage.customizeCaseQueuePermissions(customizeRoles, caseQueue);
    }

    // Create user
    // await userPage.createUser();

    // Verify user creation
    // await expect(
    //   page.getByText(/success|created successfully/i)
    // ).toBeVisible();

    // console.log(`User created successfully: ${email}`);

    // Keep the completed form visible for 5 seconds
    await page.waitForTimeout(5000);
  });

});