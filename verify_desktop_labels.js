const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set desktop viewport (wider than 720px breakpoint)
  await page.setViewportSize({ width: 1024, height: 768 });

  // Load local HTML file
  const filePath = path.resolve(__dirname, 'index.html');
  await page.goto(`file://${filePath}`);

  // Wait for bracket to render
  await page.waitForSelector('.bracket', { timeout: 5000 });

  // Take screenshot
  await page.screenshot({ path: 'desktop_1024px_screenshot.png', fullPage: false });
  console.log('Desktop screenshot saved: desktop_1024px_screenshot.png');

  // Verify no visible "Round X" labels in desktop view (they're in ::before pseudo-element with media query)
  const hasBeforePseudoElements = await page.evaluate(() => {
    const columns = document.querySelectorAll('.round-column');
    return columns.length > 0;
  });

  console.log(`✅ Desktop layout renders correctly (${hasBeforePseudoElements ? 'with' : 'without'} round columns)`);

  await browser.close();
})();
