// Minimal Vitest-compatible runtime for the dependency-light local gate.
const queue = [];
const beforeEachHooks = [];
const afterEachHooks = [];
const stubbedGlobals = new Map();
const OBJECT_CONTAINING = Symbol("objectContaining");
let suite = [];

export function describe(name, fn) {
  suite.push(name);
  fn();
  suite.pop();
}

export function beforeEach(fn) {
  beforeEachHooks.push(fn);
}

export function afterEach(fn) {
  afterEachHooks.push(fn);
}

export function test(name, fn) {
  queue.push({
    name: [...suite, name].join(" > "),
    fn,
    beforeEach: [...beforeEachHooks],
    afterEach: [...afterEachHooks],
  });
}

export const it = test;

function printable(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object";
}

function matches(actual, expected, partial = false) {
  if (isObject(expected) && expected[OBJECT_CONTAINING]) {
    return matches(actual, expected.value, true);
  }
  if (Object.is(actual, expected)) return true;
  if (Array.isArray(expected)) {
    return Array.isArray(actual)
      && actual.length === expected.length
      && expected.every((value, index) => matches(actual[index], value, partial));
  }
  if (!isObject(actual) || !isObject(expected)) return false;

  const keys = Object.keys(expected);
  if (!partial && Object.keys(actual).length !== keys.length) return false;
  return keys.every((key) => key in actual && matches(actual[key], expected[key], partial));
}

function createMatchers(actual) {
  return {
    toBe(expected) {
      if (!Object.is(actual, expected)) {
        throw new Error(`expected ${printable(actual)} to be ${printable(expected)}`);
      }
    },
    toEqual(expected) {
      if (!matches(actual, expected)) {
        throw new Error(`expected ${printable(actual)} to equal ${printable(expected)}`);
      }
    },
    toMatchObject(expected) {
      if (!matches(actual, expected, true)) {
        throw new Error(`expected ${printable(actual)} to match ${printable(expected)}`);
      }
    },
    toBeTruthy() {
      if (!actual) throw new Error(`expected ${printable(actual)} to be truthy`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`expected ${printable(actual)} to be falsy`);
    },
    toBeNull() {
      if (actual !== null) throw new Error(`expected ${printable(actual)} to be null`);
    },
    toContain(expected) {
      if (!actual?.includes?.(expected)) {
        throw new Error(`expected ${printable(actual)} to contain ${printable(expected)}`);
      }
    },
    toHaveLength(expected) {
      if (actual?.length !== expected) {
        throw new Error(`expected length ${actual?.length} to be ${expected}`);
      }
    },
    toHaveBeenCalledWith(...expectedArgs) {
      const calls = actual?.mock?.calls;
      if (!Array.isArray(calls) || !calls.some((args) => matches(args, expectedArgs))) {
        throw new Error(`expected mock calls ${printable(calls)} to contain ${printable(expectedArgs)}`);
      }
    },
    get resolves() {
      return {
        async toBe(expected) {
          createMatchers(await actual).toBe(expected);
        },
        async toBeNull() {
          createMatchers(await actual).toBeNull();
        },
        async toEqual(expected) {
          createMatchers(await actual).toEqual(expected);
        },
        async toMatchObject(expected) {
          createMatchers(await actual).toMatchObject(expected);
        },
      };
    },
    get not() {
      return {
        toBe(expected) {
          if (Object.is(actual, expected)) {
            throw new Error(`expected ${printable(actual)} not to be ${printable(expected)}`);
          }
        },
        toContain(expected) {
          if (actual?.includes?.(expected)) {
            throw new Error(`expected ${printable(actual)} not to contain ${printable(expected)}`);
          }
        },
      };
    },
  };
}

export function expect(actual) {
  return createMatchers(actual);
}

expect.objectContaining = (value) => ({ [OBJECT_CONTAINING]: true, value });

export const vi = {
  fn(implementation = () => undefined) {
    const mock = function (...args) {
      mock.mock.calls.push(args);
      return implementation.apply(this, args);
    };
    mock.mock = { calls: [] };
    return mock;
  },
  stubGlobal(name, value) {
    if (!stubbedGlobals.has(name)) {
      stubbedGlobals.set(name, {
        existed: Object.prototype.hasOwnProperty.call(globalThis, name),
        value: globalThis[name],
      });
    }
    globalThis[name] = value;
  },
  unstubAllGlobals() {
    for (const [name, original] of stubbedGlobals) {
      if (original.existed) globalThis[name] = original.value;
      else delete globalThis[name];
    }
    stubbedGlobals.clear();
  },
};

export async function __run() {
  let pass = 0;
  let fail = 0;
  for (const t of queue) {
    try {
      for (const hook of t.beforeEach) await hook();
      await t.fn();
      pass++;
    } catch (error) {
      fail++;
      console.error(`  ✗ ${t.name}\n    ${error.message}`);
    } finally {
      for (const hook of [...t.afterEach].reverse()) {
        try {
          await hook();
        } catch (error) {
          fail++;
          console.error(`  ✗ ${t.name} (afterEach)\n    ${error.message}`);
        }
      }
    }
  }
  console.log(`\n${pass} passed, ${fail} failed (${queue.length} total)`);
  if (fail > 0) process.exit(1);
}
