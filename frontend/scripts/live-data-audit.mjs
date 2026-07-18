import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SRC = path.join(ROOT, "src");

const prohibitedPaths = [
  /\/section\/data\/mockData\.ts$/,
  /\/workspaces\/lib\/fixtures\//,
  /\/_shared\/opportunities\/data\.ts$/,
  /\/_shared\/mentorship\/data\.ts$/,
];

const prohibitedImports = [
  /from\s+["'][^"']*mockData["']/,
  /from\s+["'][^"']*\/fixtures\//,
  /from\s+["'][^"']*_shared\/opportunities\/data["']/,
  /from\s+["'][^"']*_shared\/mentorship\/data["']/,
];

const prohibitedPaymentStrings = [
  "Payment Successful!",
  "Providus Bank",
  "5901234567",
  "1,240 credits",
];

const prohibitedSourcePatterns = [
  [/proj_local_/, "client-generated project ID"],
  [/ws_team_/, "client-generated workspace ID"],
  [/trust_demo_/, "bundled trust verification record"],
  [/fallbackInvestorTrustDashboard/, "bundled investor trust dashboard"],
  [/from\s+["'][^"']*hackathon\/(?:scoring|results)["']/, "client-generated hackathon scoring"],
  [/deriveJudgeFeedback\s*\(/, "client-generated hackathon judging"],
  [/scoreBrief\s*\(/, "client-generated hackathon scoring"],
];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

const failures = [];
for (const file of walk(SRC)) {
  const rel = relative(file);
  if (prohibitedPaths.some((pattern) => pattern.test(file))) {
    failures.push(`${rel}: prohibited production fixture file`);
  }
  if (!/\.(ts|tsx)$/.test(file) || /\.test\.(ts|tsx)$/.test(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  for (const pattern of prohibitedImports) {
    if (pattern.test(source)) failures.push(`${rel}: prohibited production fixture import`);
  }
  for (const value of prohibitedPaymentStrings) {
    if (source.includes(value)) failures.push(`${rel}: fake payment value ${JSON.stringify(value)}`);
  }
  for (const [pattern, label] of prohibitedSourcePatterns) {
    if (pattern.test(source)) failures.push(`${rel}: prohibited ${label}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("production live-data source audit OK");
