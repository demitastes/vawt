#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { basename } from 'path';

// Find all test files
const testFiles = readdirSync('.')
  .filter(f => (f.startsWith('test_') || f.startsWith('verify')) && (f.endsWith('.js') || f.endsWith('.mjs')))
  .sort();

if (testFiles.length === 0) {
  console.log('❌ No test files found');
  process.exit(1);
}

console.log(`🧪 Running ${testFiles.length} test file(s)...\n`);

let passed = 0;
let failed = 0;
const results = [];

for (const testFile of testFiles) {
  const testName = basename(testFile, testFile.endsWith('.mjs') ? '.mjs' : '.js');
  process.stdout.write(`⏳ ${testName}... `);

  try {
    execSync(`node ${testFile}`, { stdio: 'pipe', timeout: 60000 });
    console.log('✅');
    passed++;
    results.push({ file: testFile, status: 'PASS' });
  } catch (error) {
    console.log('❌');
    failed++;
    results.push({ file: testFile, status: 'FAIL', error: error.message });
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testFiles.length} tests\n`);

if (failed > 0) {
  console.log('Failed tests:');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  ❌ ${r.file}`);
  });
  console.log();
  process.exit(1);
} else {
  console.log('✅ All tests passed!\n');
  process.exit(0);
}
