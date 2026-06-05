#!/usr/bin/env node
/**
 * VAWT Bracket Regression Test Suite
 *
 * Comprehensive test suite for validating bracket layout, responsiveness,
 * and mobile features across viewports and interactive behaviors.
 *
 * Usage:
 *   npm test                        # Run full suite
 *   npm test -- --fast              # Run quick checks only
 *   npm test -- test_responsive.js  # Run specific test file
 *
 * Test Files:
 *   - test_responsive.js            : Static CSS responsive checks
 *   - test_responsive_visual.js     : Visual rendering at different viewports
 *   - test_mobile_features.js       : Mobile-specific layout features
 *   - test_responsive_reflow.js     : Dynamic reflow on resize
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const tests = [
  {
    name: 'Static Responsive Checks',
    file: 'test_responsive.js',
    desc: 'CSS media queries and static responsive rules'
  },
  {
    name: 'Mobile Features',
    file: 'test_mobile_features.js',
    desc: 'Mobile layout: headings, indicators, two-column grid'
  },
  {
    name: 'Responsive Reflow',
    file: 'test_responsive_reflow.js',
    desc: 'Dynamic reflow on viewport resize (desktop ↔ mobile)'
  },
  {
    name: 'Visual Rendering',
    file: 'test_responsive_visual.js',
    desc: 'Actual visual rendering at multiple viewports'
  }
];

async function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(__dirname, testFile);

    if (!fs.existsSync(testPath)) {
      console.log(`  ⚠️  ${testFile} not found`);
      resolve({ file: testFile, passed: false, reason: 'File not found' });
      return;
    }

    const proc = spawn('node', [testPath], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({
        file: testFile,
        passed: code === 0,
        output: stdout,
        error: stderr
      });
    });
  });
}

async function main() {
  console.log('=' .repeat(60));
  console.log('VAWT Bracket Regression Test Suite');
  console.log('='.repeat(60));
  console.log();

  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const test of tests) {
    console.log(`\n▶️  Running: ${test.name}`);
    console.log(`   ${test.desc}`);
    console.log(`   File: ${test.file}`);
    console.log('-'.repeat(60));

    const result = await runTest(test.file);
    results.push(result);

    if (result.passed) {
      console.log(result.output);
      totalPassed++;
    } else {
      if (result.reason) {
        console.log(`  ❌ ${result.reason}`);
      } else {
        console.log(result.output);
        if (result.error) console.log(result.error);
      }
      totalFailed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('REGRESSION SUITE SUMMARY');
  console.log('='.repeat(60));

  results.forEach((r) => {
    const status = r.passed ? '✅' : '❌';
    console.log(`${status} ${r.file}`);
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('='.repeat(60));

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
