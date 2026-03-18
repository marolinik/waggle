const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const logs = [];
  page.on('console', msg => logs.push(`console:${msg.type()}:${msg.text()}`));
  page.on('pageerror', err => logs.push(`pageerror:${err.message}`));

  try {
    await page.goto('http://127.0.0.1:1420', { waitUntil: 'networkidle', timeout: 30000 });

    // Click test-project if present, else marketing
    const testProject = page.getByText('Test Project', { exact: true });
    const marketing = page.getByText('Marketing', { exact: true });
    if (await testProject.count()) {
      await testProject.first().click();
    } else if (await marketing.count()) {
      await marketing.first().click();
    }
    await page.waitForTimeout(1500);

    // Start a fresh session if button exists
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

    // Wait for tool/approval activity
    await page.waitForTimeout(12000);
    let body = await page.locator('body').innerText();
    console.log('=== AFTER PROMPT ===');
    console.log(body.slice(0, 12000));

    // Look for approval UI and click approve if present
    const approve = page.getByRole('button', { name: /approve/i });
    const deny = page.getByRole('button', { name: /deny/i });
    console.log('APPROVE_COUNT=' + await approve.count());
    console.log('DENY_COUNT=' + await deny.count());

    if (await approve.count()) {
      await approve.first().click();
      await page.waitForTimeout(12000);
      body = await page.locator('body').innerText();
      console.log('=== AFTER APPROVAL ===');
      console.log(body.slice(0, 14000));
    }

    await page.screenshot({ path: 'tmp-slice2-risk-test.png', fullPage: true });
  } catch (err) {
    console.log('=== ERROR ===');
    console.log(String(err && err.stack || err));
  } finally {
    console.log('=== LOGS ===');
    for (const line of logs) console.log(line);
    await browser.close();
  }
})();
