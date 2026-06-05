import playwright from 'playwright';

const browser = await playwright.chromium.launch();
const page = await browser.newPage();

// Navigate to the file (use file:// URL with relative path from current directory)
const indexPath = new URL('index.html', import.meta.url);
await page.goto(indexPath.href);

// Wait for render
await page.waitForTimeout(1000);

// Check R1B1 styling (should be active)
const bout = await page.$('.bout[data-round="1"][data-bout="1"]');

if (bout) {
  // Check matchup background color
  const matchup = await bout.$('.matchup');
  const matchupStyles = await matchup.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      backgroundColor: styles.backgroundColor,
      borderColor: styles.borderColor
    };
  });

  console.log('✅ R1B1 (Active) Matchup styles:');
  console.log('   Background:', matchupStyles.backgroundColor, '(should be light green #f0fdf4)');
  console.log('   Border:', matchupStyles.borderColor, '(should be green #2d8e2d)');

  // Check bout-date color
  const boutDate = await bout.$('.bout-date');
  const dateStyles = await boutDate.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      color: styles.color
    };
  });
  console.log('   Date color:', dateStyles.color, '(should be green #22863a or #3da53d)');
} else {
  console.log('❌ R1B1 bout not found');
}

// Check R1B3 (should NOT be active)
const bout3 = await page.$('.bout[data-round="1"][data-bout="3"]');

if (bout3) {
  const matchup3 = await bout3.$('.matchup');
  const matchupStyles3 = await matchup3.evaluate(el => {
    return {
      borderColor: window.getComputedStyle(el).borderColor
    };
  });

  console.log('\n✅ R1B3 (Inactive) Matchup styles:');
  console.log('   Border:', matchupStyles3.borderColor, '(should be tan #d7b992, NOT green)');
} else {
  console.log('❌ R1B3 bout not found');
}

// Take a screenshot of the active bout
const screenshot = await page.screenshot({ path: 'test_bout_screenshot.png' });
console.log('\n📸 Screenshot saved: test_bout_screenshot.png');

await browser.close();
