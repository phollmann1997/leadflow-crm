import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();

// Login
await page.goto('http://localhost:5000');
await page.waitForTimeout(2000);
await page.fill('#username', 'petr');
await page.fill('#password', 'heslo123');
await page.click('[data-testid="button-login"]');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/home/user/workspace/crm-app/screen-dashboard.png' });
console.log('Dashboard OK');

// Firmy
await page.goto('http://localhost:5000/#/firmy');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/user/workspace/crm-app/screen-firmy.png' });
console.log('Firmy OK');

// Pipeline
await page.goto('http://localhost:5000/#/pipeline');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/user/workspace/crm-app/screen-pipeline.png' });
console.log('Pipeline OK');

// Follow-upy
await page.goto('http://localhost:5000/#/followupy');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/user/workspace/crm-app/screen-followupy.png' });
console.log('Followupy OK');

// Lead Finder
await page.goto('http://localhost:5000/#/hledat');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/user/workspace/crm-app/screen-leady.png' });
console.log('Lead Finder OK');

// Firma detail
await page.goto('http://localhost:5000/#/firma/00000000-0000-0000-0000-000000000f01');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/user/workspace/crm-app/screen-firma-detail.png' });
console.log('Firma detail OK');

await browser.close();
console.log('Done!');
