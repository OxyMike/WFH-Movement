// tests/run.js
let passed = 0, failed = 0;

export function test(name, fn) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(`        ${e.message}`);
    failed++;
  }
}

export function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected)
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

export function summary() {
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

export function run() {
  summary();
}
