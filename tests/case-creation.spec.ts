import { test } from '@playwright/test';
import ExcelJS from 'exceljs';
import path from 'path';
import { LoginPage } from './pages/LoginPage';
import { CasePage } from './pages/CasePage';

test.describe('myOmniDesk Case Creation', () => {

  test('should verify case from Excel data in All Cases table', async ({ page }) => {
    // 1. Authentication
    const loginEmail = process.env.MYOMNIDESK_EMAIL;
    const loginPassword = process.env.MYOMNIDESK_PASSWORD;

    if (!loginEmail || !loginPassword) {
      throw new Error(
        'MYOMNIDESK_EMAIL and MYOMNIDESK_PASSWORD environment variables must be set.'
      );
    }

    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(loginEmail, loginPassword);

    // Close auxiliary Amazon Connect popup if opened
    for (const p of page.context().pages()) {
      if (p !== page) {
        await p.close();
      }
    }

    // 2. Read test data from Excel workbook
    const filePath = path.resolve(
      __dirname,
      '../test-data/UserCreation.xlsx'
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet =
      workbook.getWorksheet('Cases') ||
      workbook.getWorksheet('CaseCreation') ||
      workbook.worksheets[1];

    if (!worksheet) {
      throw new Error(
        `Case worksheet not found in UserCreation.xlsx. Available sheets: ${workbook.worksheets.map(w => w.name).join(', ')}`
      );
    }

    // Select the Excel row to use (configured via CASE_ROW, default: 2)
    const rowNumber = Number(process.env.CASE_ROW || 3);
    const row = worksheet.getRow(rowNumber);

    const subject = row.getCell(1).text.trim();
    const customerEmail = row.getCell(2).text.trim();
    const source = row.getCell(3).text.trim();
    const queue = row.getCell(4).text.trim();
    const priority = row.getCell(5).text.trim();
    const description = row.getCell(6).text.trim();

    console.log(`Checking Case from Excel row ${rowNumber}: "${subject}" for ${customerEmail}`);

    const casePage = new CasePage(page);

    // Navigate to Cases section
    await casePage.navigate();
    await casePage.openCreateCaseModal();
    await casePage.fillBasicCaseInformation(subject, customerEmail);
    await casePage.selectSource(source);
    await casePage.selectQueue(queue);
    await casePage.selectPriority(priority);
    await casePage.fillDescription(description);
    await casePage.submitCase();
    await casePage.verifySuccessMessage();

    // 3. Navigate to All Cases table and verify the first row matches Excel data
    await casePage.navigateToAllCases();
    await casePage.verifyFirstRowCaseData({
      subject,
      customerEmail,
      source,
      queue,
      priority,
      expectedStatus: 'New'
    });

    console.log(`Case "${subject}" verified successfully in All Cases table with status New.`);

    // Keep the completed form visible for 5 seconds
    await page.waitForTimeout(5000);
  });

});
