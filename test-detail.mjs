import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
await page.goto('http://localhost:5000');
await page.waitForTimeout(2000);
await page.fill('#username', 'petr');
await page.fill('#password', 'heslo123');
await page.click('[data-testid="button-login"]');
await page.waitForTimeout(2500);

// Navigate to firma detail with correct route
await page.goto('http://localhost:5000/#/firmy/00000000-0000-0000-0000-000000000f01');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/home/user/workspace/crm-app/screen-firma-detail.png' });
console.log('Firma detail OK');

await browser.close();
