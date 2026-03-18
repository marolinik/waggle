const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const logs = [];
  page.on('console', msg => logs.push(`console:${msg.type()}:${msg.text()}`));
  page.on('pageerror', err => logs.push(`pageerror:${err.message}`));

  try {
    await page.goto('http://127.0.0.1:1420', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: 'tmp-app-home.png', fullPage: true });

    const bodyText = await page.locator('body').innerText();
    console.log('=== BODY START ===');
    console.log(bodyText.slice(0, 4000));
    console.log('=== BODY END ===');

    // Try to click Marketing workspace if visible
    const marketing = page.getByText('Marketing', { exact: true });
    if (await marketing.count()) {
      await marketing.first().click();
      await page.waitForTimeout(1000);
    }

    // Locate chat input / textarea
    const textbox = page.locator('textarea, input[type="text"]').first();
    await textbox.waitFor({ timeout: 10000 });

    // Test /catchup
    await textbox.fill('/catchup');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000);
    const afterCatchup = await page.locator('body').innerText();
    console.log('=== AFTER CATCHUP ===');
    console.log(afterCatchup.slice(0, 6000));

    // Test /memory decision
    await textbox.fill('/memory decision');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000);
    const afterMemory = await page.locator('body').innerText();
    console.log('=== AFTER MEMORY ===');
    console.log(afterMemory.slice(0, 7000));

    // Test grounded first-turn question
    await textbox.fill('Where are we? What matters here now?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(7000);
    const afterChat = await page.locator('body').innerText();
    console.log('=== AFTER GROUNDED CHAT ===');
    console.log(afterChat.slice(0, 9000));

    await page.screenshot({ path: 'tmp-app-after-tests.png', fullPage: true });
  } catch (err) {
    console.log('=== ERROR ===');
    console.log(String(err && err.stack || err));
  } finally {
    console.log('=== LOGS ===');
    for (const line of logs) console.log(line);
    await browser.close();
  }
})();
