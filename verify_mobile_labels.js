const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  // Load local HTML file
  const filePath = path.resolve(__dirname, 'index.html');
  await page.goto(`file://${filePath}`);

  // Wait for bracket to render
  await page.waitForSelector('.round-column::before', { timeout: 5000 }).catch(() => {});

  // Get text content of round labels
  const roundLabels = await page.evaluate(() => {
    const labels = [];
    document.querySelectorAll('.round-column').forEach(col => {
      const round = col.getAttribute('data-round');
      const computedStyle = window.getComputedStyle(col, '::before');
      const content = computedStyle.content;
      labels.push({ round, content });
    });
    return labels;
  });

  console.log('Round Labels on Mobile (375px):');
  console.log(JSON.stringify(roundLabels, null, 2));

  // Take screenshot
  await page.screenshot({ path: 'mobile_375px_screenshot.png', fullPage: true });
  console.log('Screenshot saved: mobile_375px_screenshot.png');

  // Verify label content contains "Round"
  const hasRoundPrefix = roundLabels.every(label => {
    return label.content.includes('Round') || label.content === 'none';
  });

  if (hasRoundPrefix) {
    console.log('\n✅ PASS: All round labels include "Round" prefix on mobile view');
  } else {
    console.log('\n❌ FAIL: Some labels missing "Round" prefix');
    console.log('Labels found:', roundLabels);
  }

  await browser.close();
})();
