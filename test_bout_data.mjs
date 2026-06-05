import playwright from 'playwright';

const browser = await playwright.chromium.launch();
const page = await browser.newPage();

// Capture console messages
page.on('console', msg => {
  console.log(`[${msg.type()}] ${msg.text()}`);
});

// Navigate to the file (use file:// URL with relative path from current directory)
const indexPath = new URL('index.html', import.meta.url);
await page.goto(indexPath.href);

// Wait a moment for data to load
await page.waitForTimeout(1000);

// Check if R1B1 has the is-active class
const bout = await page.$('.bout[data-round="1"][data-bout="1"]');
if (bout) {
  const classList = await bout.evaluate(el => Array.from(el.classList));
  console.log('R1B1 bout classes:', classList);
  console.log('Is R1B1 active?', classList.includes('is-active'));

  // Check matchup styling
  const matchup = await bout.$('.matchup');
  const matchupStyles = await matchup.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      backgroundColor: styles.backgroundColor,
      borderColor: styles.borderColor
    };
  });
  console.log('R1B1 Matchup styles:', matchupStyles);

  // Check bout-date color
  const boutDate = await bout.$('.bout-date');
  const dateStyles = await boutDate.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      color: styles.color
    };
  });
  console.log('R1B1 Bout date color:', dateStyles);
} else {
  console.log('R1B1 bout not found');
}

// Check R1B3 (should NOT be active - starts Jun 6)
const bout3 = await page.$('.bout[data-round="1"][data-bout="3"]');
if (bout3) {
  const classList3 = await bout3.evaluate(el => Array.from(el.classList));
  console.log('\nR1B3 classes:', classList3);
  console.log('Is R1B3 active?', classList3.includes('is-active'));

  const matchup3 = await bout3.$('.matchup');
  const matchupStyles3 = await matchup3.evaluate(el => {
    return {
      borderColor: window.getComputedStyle(el).borderColor
    };
  });
  console.log('R1B3 matchup border:', matchupStyles3.borderColor);
} else {
  console.log('R1B3 bout not found');
}

await browser.close();
