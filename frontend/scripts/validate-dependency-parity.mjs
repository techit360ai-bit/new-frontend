import fs from "node:fs";
import path from "node:path";

// react-router and react-router-dom must always resolve to the same version.
// A mismatch installs two copies of react-router, so the Router context created
// by one copy is invisible to useLocation() in the other and every route crashes
// with "useLocation() may be used only in the context of a <Router> component".
const PAIRS = [["react-router", "react-router-dom"]];

const packageJsonPath = path.resolve(
  new URL("../package.json", import.meta.url).pathname,
);
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const declared = { ...pkg.dependencies, ...pkg.devDependencies };

const normalize = (value) => String(value ?? "").trim().replace(/^[~^]/, "");

const failures = [];
for (const [left, right] of PAIRS) {
  const leftValue = declared[left];
  const rightValue = declared[right];
  if (!leftValue || !rightValue) {
    failures.push(`${left} and ${right} must both be declared as dependencies`);
    continue;
  }
  if (normalize(leftValue) !== normalize(rightValue)) {
    failures.push(
      `${left}=${leftValue} and ${right}=${rightValue} are not aligned; ` +
        `they must be upgraded as a coordinated pair`,
    );
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`dependency parity: ${failure}`);
  process.exit(1);
}

console.log(
  `dependency parity OK: ${PAIRS.map(([left, right]) => `${left}=${declared[left]} ${right}=${declared[right]}`).join(", ")}`,
);
