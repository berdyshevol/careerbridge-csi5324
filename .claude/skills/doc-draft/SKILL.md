---
name: doc-draft
description: Draft one section of the CareerBridge documentation from the system as it is, then show old against new. Argument `intro` rewrites spec/vision.md section 1 (and any iteration wording in section 2) as an overview of the whole system; argument `testing-summary` writes spec/testing.md section 9.1 from the real test suites and their counts. Use when asked to "rewrite the introduction", "fix the intro feedback", "write the testing summary", "fill in 9.1", or when the PDF shows "Not written yet" in 9.1. Not for the test-case table of 9.2 (each member writes their own cases), and not for the Change Logs (use doc-changelog).
---

# Draft a documentation section

You write a draft, show the old text next to the new, and change nothing before a yes. On a yes,
hand the change to the `implement-task` skill (a documentation task, one ticket, one pull
request). Follow `spec/CLAUDE.md`: keep the section numbers, one fact in one file (link, do not
repeat), plain English.

## `intro`: spec/vision.md section 1

Dr. Ren's feedback on Iteration II: "Introduction is the part to give an overview of the whole
system. No need to include any explanation about the iteration."

1. Read `spec/vision.md`, the use-case index in `spec/use-cases.md` and `spec/user-manual.md`
   §12.1 for what works now.
2. Rewrite `## 1. Introduction` as an overview of the whole system: who uses it (the four roles),
   what problem it solves, what it does, in three or four short paragraphs. No iteration, no
   deliverable, no "this document is…", no plans. Keep the business rules it cites (BR-1).
   **What it does lists only what works:** the features of the User Manual (§12) without its "Not
   yet available" items, checked against the code on `main`. A use case that is designed but not
   built (or built only in part) is not described as working; leave it out, or name it once as
   planned. Never present a planned feature as a capability.
3. In `## 2. Project Overview`, find every mention of an iteration or deliverable
   (`grep -n -i "iteration\|deliverable" spec/vision.md`) and propose wording without it ("outside
   the scope of Iteration 1" → "outside the scope of CareerBridge"). Change nothing else in §2.
4. Show the old §1 and the new §1 in full, then each changed §2 line as old → new.

## `testing-summary`: spec/testing.md section 9.1

1. Count the tests that exist, and run them if it takes less than about 15 minutes; otherwise
   count them in the sources and say the counts are static:
   - JUnit: `cd app/backend && ./mvnw -q -B test`, then the totals of
     `target/surefire-reports/TEST-*.xml`; group the test classes by layer (entity, service,
     controller, configuration). Static: `grep -rc "@Test" app/backend/src/test`.
   - Vitest: `cd app/frontend && npx vitest run` (the "Test Files" and "Tests" lines).
   - Playwright: `npx bddgen && npx playwright test --list` for the count per project (laptop,
     phone, scenarios); `npm run test:e2e` to run them. The scenarios are the Gherkin files of
     `spec/user-scenarios/`.
2. Read when they run: `app/frontend/.husky/pre-push` (before a push that changes the app),
   `.github/workflows/ci.yml` (every pull request), `.github/workflows/deploy.yml` (the same
   checks before a deploy), and the database they use (`app/backend/src/test/resources/config/`,
   ADR-0009).
3. Read the test-case table of §9.2: how many cases, for which use cases, who wrote them, and how
   the Actual Result names the automated test.
4. Write §9.1 under its heading: what each suite covers, how many tests it has (with the date of
   the count), how and when it runs, and how §9.2 relates to the suites. Credit the AI tool where
   the cases say it helped (Dr. Ren asked for it). No table of every test.
5. Show the old §9.1 and the new one.

## Do not

- Do not write to `spec/` before a yes; do not touch other sections.
- Do not quote counts you did not run or count; say how each number was found.
- Do not commit, push, submit or send anything from this skill.
