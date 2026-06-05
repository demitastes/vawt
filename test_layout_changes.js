const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Desktop view
  let page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.goto("http://localhost:8080/index.html");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "./desktop-view.png" });
  console.log("✓ Desktop screenshot saved");

  // Mobile view
  page = await browser.newPage({ viewport: { width: 375, height: 667 } });
  await page.goto("http://localhost:8080/index.html");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "./mobile-view.png" });
  console.log("✓ Mobile screenshot saved");

  // Verify disclaimer text exists
  const headerText = await page.textContent("header p");
  if (headerText && headerText.includes("noon EDT")) {
    console.log("✓ Disclaimer text found:", headerText.trim());
  } else {
    console.log("✗ Disclaimer text missing");
  }

  // Verify date format
  const dateText = await page.textContent(".bout-date");
  if (dateText && !dateText.includes("Noon EDT")) {
    console.log("✓ Date format correct (no 'Noon EDT'):", dateText.trim());
  } else {
    console.log("✗ Date still contains 'Noon EDT':", dateText);
  }

  // Verify active indicator is present in active bouts
  const activeIndicators = await page.$$(".bout.is-active .bout-active-indicator");
  if (activeIndicators.length > 0) {
    console.log(`✓ Found ${activeIndicators.length} active indicators in date containers`);
  }

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
