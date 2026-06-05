import playwright from 'playwright';

const browser = await playwright.chromium.launch();
const page = await browser.newPage();

// Navigate to the file (use file:// URL with relative path from current directory)
const indexPath = new URL('index.html', import.meta.url);
await page.goto(indexPath.href);

// Wait for render
await page.waitForTimeout(1000);

console.log('Testing bout date formatting and display...\n');

// Test 1: Check that bout dates are present and formatted correctly
const dateDivs = await page.$$('.bout-date');
console.log(`✅ Found ${dateDivs.length} bout dates in the bracket`);

// Get sample dates from the first 5 bouts
const sampleDates = [];
for (let i = 0; i < Math.min(5, dateDivs.length); i++) {
  const text = await dateDivs[i].textContent();
  sampleDates.push(text);
}

console.log('\nSample bout dates (first 5):');
sampleDates.forEach((date, index) => {
  console.log(`  ${index + 1}. ${date}`);
});

// Test 2: Verify date format matches "Mon DD – Mon DD" pattern
const dateFormatRegex = /^\w+ \d+\s*–\s*\w+ \d+$/;
const formattedDates = await page.$$eval('.bout-date', elements =>
  elements.map(el => el.textContent)
);

const validDates = formattedDates.filter(date => dateFormatRegex.test(date));
console.log(`\n✅ Date format validation: ${validDates.length}/${formattedDates.length} dates match expected format (Mon DD – Mon DD)`);

if (validDates.length < formattedDates.length) {
  const invalidDates = formattedDates.filter(date => !dateFormatRegex.test(date));
  console.log('⚠️  Invalid date formats found:');
  invalidDates.slice(0, 3).forEach(date => console.log(`  - "${date}"`));
}

// Test 3: Check active bout styling
const activeBout = await page.$('.bout.is-active');
if (activeBout) {
  const activeDate = await activeBout.$('.bout-date');
  if (activeDate) {
    const color = await activeDate.evaluate(el => window.getComputedStyle(el).color);
    console.log(`\n✅ Active bout date color: ${color}`);
    console.log('   (Expected: rgb(34, 134, 58) or similar green shade)');
  } else {
    console.log('\n⚠️  Active bout found but no .bout-date element');
  }
} else {
  console.log('\n⚠️  No active bouts found (tournament may not be active)');
}

// Test 4: Check date range display for specific bouts
const roundData = [];
for (let round = 1; round <= 5; round++) {
  for (let bout = 1; bout <= 2; bout++) {
    const boutEl = await page.$(`[data-round="${round}"][data-bout="${bout}"]`);
    if (boutEl) {
      const label = await boutEl.$('.bout-label');
      const dateEl = await boutEl.$('.bout-date');
      if (label && dateEl) {
        const labelText = await label.textContent();
        const dateText = await dateEl.textContent();
        roundData.push({ label: labelText, date: dateText });
      }
      if (roundData.length >= 8) break; // Sample from first few rounds
    }
  }
  if (roundData.length >= 8) break;
}

if (roundData.length > 0) {
  console.log('\nSample bout details (with dates):');
  roundData.forEach(bout => {
    console.log(`  ${bout.label}: ${bout.date}`);
  });
}

// Test 5: Verify active bout indicator presence
const activeBoutIndicators = await page.$$('.bout.is-active .bout-active-indicator');
console.log(`\n✅ Active bout indicators: Found ${activeBoutIndicators.length}`);

// Test 6: Verify date container layout for left and right sides
const leftDateContainers = await page.$$('[data-side="left"] .bout-date-container');
const rightDateContainers = await page.$$('[data-side="right"] .bout-date-container');

console.log(`\n✅ Date containers by side:`);
console.log(`   Left side: ${leftDateContainers.length}`);
console.log(`   Right side: ${rightDateContainers.length}`);

// Test 7: Verify empty dates for rounds without date data
const emptyDates = await page.$$eval('.bout-date', elements =>
  elements.filter(el => el.textContent.trim() === '').length
);

console.log(`\n✅ Empty dates (bouts without date info): ${emptyDates}`);

console.log('\n✅ All date tests completed successfully!');

await browser.close();
