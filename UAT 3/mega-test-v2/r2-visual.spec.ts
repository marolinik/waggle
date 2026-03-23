import { test, chromium } from '@playwright/test';

const TOKEN = '36a36b027129a154c0e86122ed56927409b612b6eb41f612b9177c85848719d3';
const BASE_URL = 'http://localhost:3333';
const SS_DIR = 'UAT 3/mega-test-v2/screenshots';

async function newPage(browser: any, width = 1920, height = 1080) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    storageState: {
      cookies: [],
      origins: [{ origin: BASE_URL, localStorage: [
        { name: 'waggle:onboarding', value: JSON.stringify({ completed: true }) },
        { name: 'waggle:theme', value: 'dark' }
      ]}]
    },
    extraHTTPHeaders: { 'Authorization': `Bearer ${TOKEN}` }
  });
  return ctx.newPage();
}

test('r2-visual-ux', async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await newPage(browser);
  
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${SS_DIR}/01-chat-view-dark.png` });
  
  const html = await page.content();
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
  console.log('Img tags:', (html.match(/<img[^>]+>/g) || []).length);
  console.log('Honeycomb/hex:', html.toLowerCase().includes('honeycomb') || html.includes('hexagon'));
  console.log('Emoji in nav:', /[🐝🍯⚙]/u.test(html));
  
  // Check nav icons (should be img, not emoji)
  const navImgs = await page.locator('nav img, aside img, [role="navigation"] img').count();
  console.log('Nav img elements:', navImgs);
  
  // AI response border
  const aiMsgBorder = await page.locator('[class*="honey"], [class*="amber"], [class*="ai-msg"]').count();
  console.log('Honey/AI styled elements:', aiMsgBorder);
  
  // Empty state bee
  const emptyStateBee = await page.locator('[alt*="bee"], img[src*="bee"], [class*="empty"]').count();
  console.log('Empty state / bee elements:', emptyStateBee);
  
  await browser.close();
});
