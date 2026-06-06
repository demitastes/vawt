const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 800 } });
  
  await page.goto('file:///Users/doug/PERSONAL/DEMITASTES/dev/vawt-website-static/distilleries/bradys.html');
  
  // Scroll to Tournament Bouts section
  await page.locator('h2:has-text("Tournament Bouts")').scrollIntoViewIfNeeded();
  
  // Take screenshot of the Tournament Bouts area
  const section = await page.locator('section:has(h2:has-text("Tournament Bouts"))');
  await section.screenshot({ path: '/tmp/bouts_desktop.png' });
  
  console.log('Desktop screenshot saved');
  
  // Check table dimensions
  const tableHeight = await page.locator('.bouts-table').evaluate(el => el.offsetHeight);
  const rowDisplay = await page.locator('.bout-row').evaluate(el => window.getComputedStyle(el).display);
  
  console.log('Desktop table height:', tableHeight);
  console.log('Desktop row display:', rowDisplay);
  
  await browser.close();
})();
