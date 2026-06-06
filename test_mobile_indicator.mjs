import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 375, height: 667 }
});

const page = await context.newPage();
await page.goto('http://localhost:8888/distilleries/open-road.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const screenshot = await page.screenshot({ path: './test_mobile_indicator.png' });
console.log('Screenshot saved to test_mobile_indicator.png');

// Scroll to the bouts table section
await page.locator('.bouts-table').scrollIntoViewIfNeeded().catch(() => {});
await page.waitForTimeout(200);

// Take a second screenshot of the bouts table area
const boutScreenshot = await page.screenshot({ path: './test_mobile_indicator_bouts.png' });
console.log('Screenshot of bouts table saved to test_mobile_indicator_bouts.png');

// Check if active indicators are visible and properly positioned
const allIndicators = await page.locator('.bout-active-indicator').count();
console.log(`Found ${allIndicators} active indicators on page`);

// Check any bout-active-indicator
const anyIndicator = page.locator('.bout-active-indicator').first();
const box = await anyIndicator.boundingBox();
if (box) {
  console.log(`Indicator position: x=${box.x.toFixed(1)}, y=${box.y.toFixed(1)}, width=${box.width}, height=${box.height}`);

  // Check if it's within viewport bounds (375px wide)
  if (box.x >= 0 && box.x + box.width <= 375) {
    console.log('✓ Indicator is within viewport bounds - properly positioned on mobile');
  } else {
    console.log(`✗ Indicator extends outside viewport (x=${box.x.toFixed(1)}, right edge=${(box.x + box.width).toFixed(1)}, viewport=375)`);
  }
} else {
  console.log('Could not get indicator bounding box');
}

await browser.close();
