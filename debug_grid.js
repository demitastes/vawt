const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 800 } });
  await page.goto('file:///Users/doug/PERSONAL/DEMITASTES/dev/vawt-website-static/distilleries/bradys.html');
  
  const display = await page.locator('.grid').evaluate(el => window.getComputedStyle(el).display);
  const cols = await page.locator('.grid').evaluate(el => window.getComputedStyle(el).gridTemplateColumns);
  
  console.log('Display:', JSON.stringify(display));
  console.log('Columns:', JSON.stringify(cols));
  console.log('Columns split:', cols.split(' '));
  
  await browser.close();
})();
