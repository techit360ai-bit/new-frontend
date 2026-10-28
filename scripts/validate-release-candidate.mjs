import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SIGNOFF = path.join(ROOT, "docs", "RELEASE_CANDIDATE_SIGNOFF.md");
const WORKFLOW = path.join(ROOT, ".github", "workflows", "frontend.yml");

function fail(message) {
  throw new Error(message);
}

function requireIncludes(content, needle, message) {
  if (!content.includes(needle)) fail(message);
}

function tableRows(section) {
  return section
    .split(/\r?\n/)
    .filter((line) => line.startsWith("|") && !line.includes("---"));
}

function section(content, heading) {
  const start = content.indexOf(heading);
  if (start === -1) fail(`missing section: ${heading}`);
  const next = content.indexOf("\n## ", start + heading.length);
  return content.slice(start, next === -1 ? undefined : next);
}

try {
  const signoff = fs.readFileSync(SIGNOFF, "utf8");
  const workflow = fs.readFileSync(WORKFLOW, "utf8");

  const statusMatch = signoff.match(/^Status:\s*(.+)$/m);
  if (!statusMatch) fail("release signoff must declare Status");
  const status = statusMatch[1].trim().toLowerCase();
  if (!["draft", "approved"].includes(status)) {
    fail("release signoff Status must be draft or approved");
  }

  for (const phrase of [
    "Frontend clean clone",
    "Node backend",
    "Plugins-MCP",
    "Go messaging",
    "AI Router",
    "Full-stack staging",
    "Security regression",
    "Observability",
    "Rollback",
    "Post-deploy smoke",
  ]) {
    requireIncludes(signoff, phrase, `release signoff is missing ${phrase}`);
  }

  for (const field of [
    "Release candidate tag",
    "Staging URL",
    "Frontend run URL",
    "BACKEND run URL",
    "AI Router run URL",
    "Smoke-test operator",
    "Release approver",
    "Rollback owner",
    "Approval timestamp",
  ]) {
    requireIncludes(signoff, field, `approval record is missing ${field}`);
  }

  for (const hardStop of [
    "Any required gate is pending",
    "Any production secret is missing",
    "Any service accepts protected requests without a valid bearer token",
    "Staging smoke cannot prove",
    "Rollback owner or rollback procedure is unknown",
  ]) {
    requireIncludes(signoff, hardStop, `hard stop list is missing: ${hardStop}`);
  }

  if (status === "approved") {
    const requiredRows = tableRows(section(signoff, "## Required Gates"));
    const approvalRows = tableRows(section(signoff, "## Approval Record"));
    const pending = [...requiredRows, ...approvalRows].filter((line) => /\bpending\b/i.test(line));
    if (pending.length > 0) {
      fail("approved release signoff cannot contain pending evidence");
    }
  }

  requireIncludes(
    workflow,
    "node scripts/validate-release-candidate.mjs",
    "frontend workflow must validate release candidate signoff",
  );

  console.log("release candidate signoff gate OK");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
