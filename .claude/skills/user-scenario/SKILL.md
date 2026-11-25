---
name: user-scenario
description: Write or audit the executable acceptance scenarios of a CareerBridge use case — the Gherkin `.feature` files in spec/user-scenarios run by playwright-bdd, one per outcome of the use case (main success scenario and each extension), in domain language, with steps from app/frontend/e2e/scenarios/dsl.ts and screens only in driver.ts. Use when asked to "write scenarios for UC-NN", "check/audit the scenarios of UC-NN", "do we have acceptance scenarios for …", "add a .feature", "scenario coverage", when given a use case or a described behaviour to turn into an acceptance scenario, and from implement-task for a slice whose Covers line names use-case steps or extensions.
---

# User scenarios

You write or audit the acceptance scenarios of one use case. The rules are in
`spec/user-scenarios/README.md`: read it first; it is the only statement of them, and this file is
just the order of work. You do not create branches or pull requests: implement-task does.

## Input

- `UC-NN` (or `Log In`), or a described behaviour. Map a description to the use case and the step or
  extension it belongs to in `spec/use-cases.md`; if none fits, ask instead of inventing one.
- The mode: **write** (add or fix scenarios) or **audit** (read only, report). If not given, audit.

## Read first

1. `spec/user-scenarios/README.md`, then one existing `.feature` as the model.
2. The use case in `spec/use-cases.md`: main success scenario, extensions, special requirements; and its
   FRs in `spec/requirements.md`.
3. Every `spec/user-scenarios/*.feature` tagged with this use case.
4. `app/frontend/e2e/scenarios/dsl.ts` whole (the step vocabulary) and the exports of `driver.ts`.

## List the outcomes

One row per outcome: the main success scenario, and each extension (the README says when extensions may
share a scenario, and how an extension with several cases is shown). For each, the scenario that covers
it, or "not covered" with the reason (it cannot be set up by a scenario, it needs another use case that
is not on main). In write mode, show this list to the person and wait for an OK before writing.

## Write mode

1. One `.feature` per uncovered outcome, copied from the model: first-line comment, tags (use case,
   steps or extension, `@scope-<role>-<n>`, any system-wide requirement), `Feature:` with the use case,
   `Scenario:` with the outcome.
2. Steps from `dsl.ts` first. Before a new step, search `dsl.ts` for its key words, so the same meaning
   never gets a second phrasing. A new step is one definition in `dsl.ts` under the use case's heading
   that only calls the driver; anything about screens, wording or the API goes in `driver.ts`.
   `Given` data is set up through the API (`…ByApi`); `When` and `Then` go through the screens.
3. Each scenario creates its own people and postings under aliases. Shared demo data is allowed only for
   the two exceptions the README names.
4. Run them: `cd app/frontend && npx bddgen && npx playwright test --project=scenarios --grep @UC-NN`.
5. **Show that it can fail.** Start from a clean working tree. For each new scenario of an extension (and
   for a main success scenario when asked), break the behaviour it checks in the app code for a moment,
   run it, and see exactly that scenario fail at its `Then`; then `git checkout` the file and confirm
   `git diff` is empty. A scenario that does not fail is rewritten or removed.
6. Update the "Scenarios" and "Coverage" tables in the README.

## Audit mode

Change nothing. For each scenario of the use case, check: domain language only (no buttons, fields, page
titles, addresses or exact messages in the `.feature`; no `page.`, `getBy` or `goto` in `dsl.ts`); one
outcome; its own data; it matches the use case's step or extension and claims nothing more; its tags; and
that no `Then` is empty or can only pass. For a refusal, read the app code to confirm the system refuses
(the backend, not only the browser's form), or the `Then` does not test the system. Then check that every
outcome, and every case of an extension that has several, is covered or listed in the README's Coverage
table with a reason.

## Report

A table: use-case step or extension → scenario file → covered, not covered (why), or the problem found.
Then, in write mode, the run result and the fail check for each new scenario.

## Minimum-scope tags

The course's minimum scope is not in this repository and must not be copied into it. Take the item
number for `@scope-<role>-<n>` from the "Coverage" section of the README or ask Oleg; if it is not known,
leave the tag out and say "minimum-scope item to confirm with Oleg" in the report.

## Hand-off

Inside implement-task, return to its step d (tests) with the files written. Outside it, offer a ticket
`UC-NN · acceptance scenarios` and continue with implement-task.
