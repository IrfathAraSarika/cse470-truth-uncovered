const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const output = path.resolve('docs/screenshots/sprint-1');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

  await page.goto('http://localhost:5173/submit-report');
  await page.getByPlaceholder('Brief title of the incident').fill('Unauthorized procurement payment at district office');
  await page.locator('input[type=date]').fill('2026-07-10');
  await page.locator('input[type=time]').fill('14:30');
  await page.getByPlaceholder('Office, road, institution, or nearby landmark').fill('District Administration Office, Dhaka');
  await page.getByPlaceholder(/Describe what happened/).fill('An official requested an unofficial payment before accepting a public procurement document.');
  await page.screenshot({ path: path.join(output, '01-structured-report-builder.png'), fullPage: true });

  await page.goto('http://localhost:5173/evidence-vault');
  await page.locator('input[type=file]').setInputFiles(path.resolve('frontend/src/assets/hero.png'));
  await page.getByRole('button', { name: 'Encrypt and Store' }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(output, '02-encrypted-evidence-vault.png'), fullPage: true });

  await page.goto('http://localhost:5173/');
  await page.evaluate(() => localStorage.setItem('citizen', JSON.stringify({ citizen_id: 'demo-citizen', name: 'Demo User', email: 'demo@truth.local' })));
  await page.goto('http://localhost:5173/submit-anonymous');
  await page.getByPlaceholder('Brief summary of the incident').fill('Anonymous report of bribery');
  await page.getByPlaceholder('Describe what happened, when, and where').fill('A payment was requested to process a routine public service application.');
  await page.screenshot({ path: path.join(output, '03-anonymous-submission.png'), fullPage: true });

  await page.goto('http://localhost:5173/case-tracker');
  await page.screenshot({ path: path.join(output, '04-case-lifecycle-tracker.png'), fullPage: true });

  await page.goto('http://localhost:5173/login');
  await page.getByPlaceholder('you@example.com').fill('iracus02@gmail.com');
  await page.locator('input[type=password]').fill('Tuhin123$');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/admin/verification');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(output, '05-multi-admin-verification.png'), fullPage: true });

  await browser.close();
  console.log(output);
})();
