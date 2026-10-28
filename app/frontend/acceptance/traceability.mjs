// Fails when an FR of a covered use case has no running acceptance specification, or when a
// specification's tag names an item that is not in spec/ (ADR-0011).
// Run from app/frontend: npm run test:traceability
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// A use case joins this list when its acceptance specifications are written, so the ones not yet
// covered do not fail the check.
const COVERED_USE_CASES = ["UC-01"];

const spec = (file) => readFileSync(new URL(`../../../spec/${file}`, import.meta.url), "utf8");
const requirements = spec("requirements.md");
const useCases = spec("use-cases.md");

const frs = [...requirements.matchAll(/\*\*(FR-UC\d+\.\d+):\*\*/g)].map((m) => m[1]);
const known = new Set([
  ...frs,
  ...[...requirements.matchAll(/\*\*(NFR-UC\d+\.\d+)\b/g)].map((m) => m[1]),
  ...[...requirements.matchAll(/\b(BR-\d+):/g)].map((m) => m[1]),
]);
for (const [, id] of useCases.matchAll(/\*\*Table \d+: (UC-\d+)\b/g)) {
  known.add(id);
  // The use case's own table runs to the next table; its extensions are written **2a.**, **\*a.**
  const table = useCases.slice(useCases.indexOf(`: ${id} `)).split(/\n\*\*Table \d+:/)[0];
  const extensions = table.split("\n").find((row) => row.startsWith("|**Extensions**|")) ?? "";
  for (const [, ext] of extensions.matchAll(/\*\*(\\\*a|\d+[a-z])\.\*\*/g)) known.add(`${id}-${ext.replace("\\", "")}`);
}

const listed = JSON.parse(
  execFileSync("npx", ["playwright", "test", "--project=acceptance", "--list", "--reporter=json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }),
);
const tests = [];
const walk = (suite) => {
  for (const s of suite.specs ?? []) {
    tests.push({ title: s.title, tags: s.tags, running: s.tests.every((t) => t.expectedStatus !== "skipped") });
  }
  (suite.suites ?? []).forEach(walk);
};
listed.suites.forEach(walk);

const problems = [];
for (const test of tests) {
  for (const tag of test.tags) {
    if (!known.has(tag)) problems.push(`"${test.title}" is tagged @${tag}, which is not in spec/`);
  }
}
for (const useCase of COVERED_USE_CASES) {
  for (const fr of frs.filter((id) => id.startsWith(`FR-${useCase.replace("-", "")}.`))) {
    const tagged = tests.filter((test) => test.tags.includes(fr));
    const running = tagged.filter((test) => test.running).length;
    console.log(`${fr}: ${running} running, ${tagged.length - running} fixme`);
    if (running === 0) problems.push(`${fr} has no running acceptance specification`);
  }
}

if (problems.length) {
  console.error(problems.map((p) => `traceability: ${p}`).join("\n"));
  process.exit(1);
}
console.log(`traceability: ${tests.length} acceptance specifications trace to spec/`);
