const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const logs = [];
  page.on('console', msg => logs.push(`console:${msg.type()}:${msg.text()}`));
  page.on('pageerror', err => logs.push(`pageerror:${err.message}`));

  try {
    await page.goto('http://127.0.0.1:1420', { waitUntil: 'networkidle', timeout: 30000 });

    const testProject = page.getByText('Test Project', { exact: true });
    if (await testProject.count()) await testProject.first().click();
    await page.waitForTimeout(1500);

    const newSession = page.getByText('New Session', { exact: true });
    if (await newSession.count()) {
      await newSession.first().click();
      await page.waitForTimeout(1000);
    }

    const textbox = page.locator('textarea, input[type="text"]').first();
    await textbox.waitFor({ timeout: 10000 });
    const prompt = 'Do a risk assessment for this project. Identify the top risks, evaluate likelihood and impact, and suggest mitigations.';
    await textbox.fill(prompt);
    await page.keyboard.press('Enter');

    await page.waitForTimeout(12000);
    const approveButtons = page.getByRole('button', { name: /approve/i });
    const approveCount = await approveButtons.count();
    console.log('APPROVE_COUNT=' + approveCount);
    if (approveCount > 0) {
      await approveButtons.nth(approveCount - 1).click();
      console.log('CLICKED_APPROVE');
      await page.waitForTimeout(15000);
    }

    const body = await page.locator('body').innerText();
    console.log('=== FINAL BODY ===');
    console.log(body.slice(0, 15000));

    await page.screenshot({ path: 'tmp-slice2-risk-smoke.png', fullPage: true });
  } catch (err) {
    console.log('=== ERROR ===');
    console.log(String(err && err.stack || err));
  } finally {
    console.log('=== LOGS ===');
    for (const line of logs) console.log(line);
    await browser.close();
  }
})();
