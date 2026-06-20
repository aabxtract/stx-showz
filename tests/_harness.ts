import assert from "node:assert/strict";

type TestFn = () => void | Promise<void>;
interface TestCase {
  name: string;
  fn: TestFn;
}

const suites: { name: string; tests: TestCase[] }[] = [];
let current: { name: string; tests: TestCase[] } | null = null;

export function describe(name: string, body: () => void): void {
  current = { name, tests: [] };
  body();
  suites.push(current);
  current = null;
}

export function test(name: string, fn: TestFn): void {
  if (!current) {
    suites.push({ name: "(root)", tests: [{ name, fn }] });
    return;
  }
  current.tests.push({ name, fn });
}

export { assert };

export async function runAll(): Promise<{ passed: number; failed: number }> {
  let passed = 0;
  let failed = 0;
  for (const suite of suites) {
    console.log(`\n${suite.name}`);
    for (const t of suite.tests) {
      try {
        await t.fn();
        console.log(`  ✓ ${t.name}`);
        passed++;
      } catch (err) {
        console.log(`  ✗ ${t.name}`);
        console.log(`    ${(err as Error).message}`);
        failed++;
      }
    }
  }
  return { passed, failed };
}
