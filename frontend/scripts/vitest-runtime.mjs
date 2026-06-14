// Minimal vitest-compatible runtime (test/describe/expect) for the local gate.
const queue = [];
let suite = [];

export function describe(name, fn) {
  suite.push(name);
  fn();
  suite.pop();
}
export function test(name, fn) {
  queue.push({ name: [...suite, name].join(" > "), fn });
}
export const it = test;

export function expect(actual) {
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  return {
    toBe(e) { if (actual !== e) throw new Error(`expected ${JSON.stringify(actual)} to be ${JSON.stringify(e)}`); },
    toEqual(e) { if (!eq(actual, e)) throw new Error(`expected ${JSON.stringify(actual)} to equal ${JSON.stringify(e)}`); },
    toBeTruthy() { if (!actual) throw new Error(`expected ${JSON.stringify(actual)} to be truthy`); },
    toBeFalsy() { if (actual) throw new Error(`expected ${JSON.stringify(actual)} to be falsy`); },
    toBeNull() { if (actual !== null) throw new Error(`expected ${JSON.stringify(actual)} to be null`); },
    toContain(e) { if (!actual?.includes?.(e)) throw new Error(`expected ${JSON.stringify(actual)} to contain ${JSON.stringify(e)}`); },
    toHaveLength(n) { if (actual?.length !== n) throw new Error(`expected length ${actual?.length} to be ${n}`); },
    get not() {
      return {
        toBe(e) { if (actual === e) throw new Error(`expected ${JSON.stringify(actual)} not to be ${JSON.stringify(e)}`); },
        toContain(e) { if (actual?.includes?.(e)) throw new Error(`expected ${JSON.stringify(actual)} not to contain ${JSON.stringify(e)}`); },
      };
    },
  };
}

export async function __run() {
  let pass = 0, fail = 0;
  for (const t of queue) {
    try { await t.fn(); pass++; }
    catch (e) { fail++; console.error(`  ✗ ${t.name}\n    ${e.message}`); }
  }
  console.log(`\n${pass} passed, ${fail} failed (${queue.length} total)`);
  if (fail > 0) process.exit(1);
}
