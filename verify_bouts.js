const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
  
  await page.goto('file:///Users/doug/PERSONAL/DEMITASTES/dev/vawt-website-static/distilleries/bradys.html');
  
  // Scroll to Tournament Bouts section
  await page.locator('h2:has-text("Tournament Bouts")').scrollIntoViewIfNeeded();
  
  // Take screenshot of the Tournament Bouts area and some context
  const section = await page.locator('section:has(h2:has-text("Tournament Bouts"))');
  await section.screenshot({ path: '/tmp/bouts_section.png' });
  
  console.log('Screenshot saved');
  
  // Get computed styles to see what's happening
  const table = await page.locator('.bouts-table');
  const boutRow = await page.locator('.bout-row');
  const boutLabel = await page.locator('.bout-label');
  const boutDates = await page.locator('.bout-dates');
  const boutLinks = await page.locator('.bout-links');
  
  const tableHeight = await table.evaluate(el => el.offsetHeight);
  const rowHeight = await boutRow.evaluate(el => el.offsetHeight);
  const labelHeight = await boutLabel.evaluate(el => el.offsetHeight);
  
  console.log('Table height:', tableHeight);
  console.log('Bout row height:', rowHeight);
  console.log('Bout label height:', labelHeight);
  
  // Check display properties
  const tableDisplay = await table.evaluate(el => window.getComputedStyle(el).display);
  const rowDisplay = await boutRow.evaluate(el => window.getComputedStyle(el).display);
  const labelDisplay = await boutLabel.evaluate(el => window.getComputedStyle(el).display);
  
  console.log('Table display:', tableDisplay);
  console.log('Row display:', rowDisplay);
  console.log('Label display:', labelDisplay);
  
  await browser.close();
})();
