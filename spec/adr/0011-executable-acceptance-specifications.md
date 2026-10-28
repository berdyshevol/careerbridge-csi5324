# ADR-0011: Use cases are checked by executable acceptance specifications

- **Status:** Accepted
- **Date:** 2026-10-28

## Context

The end-to-end tests in `app/frontend/e2e/` check screens: URL parameters, focus, copy, phone
width. They are written against the sample rows of `jobs.csv`, so they say little about whether a
use case does what `spec/` says, and nothing links a test to the requirement it checks. Reviewers
(the instructor, the team) have to read code to see whether FR-UC01.2 or BR-9 is really met.

## Decision

- Each use case gets **executable acceptance specifications** in `app/frontend/acceptance/`, in
  Dave Farley's four layers:
  - `specs/` — one test per acceptance criterion, written from the specification text: the main
    scenario, each extension, the FRs, and the BRs and NFRs that read like business rules. Only
    words of the specification appear there.
  - `dsl/` — domain verbs (a recruiter publishes a posting, a visitor searches the job board, the
    board shows these postings). Names give each test unique data and valid defaults.
  - `drivers/` — talk to the system. For now only an API driver over Playwright's `request`; it
    returns business outcomes, never HTTP responses.
  - the system itself, started as for the end-to-end tests (PostgreSQL in Docker, ADR-0009).
- Each test creates its own data through the public API (a recruiter submits, the Administrator
  approves) and looks only at that data; sample rows are used only for what has no API yet (the
  organizations).
- Each test carries a tag naming the specification item it checks (`@FR-UC01.1`, `@BR-9`,
  `@UC-01-2b`). A script in CI fails when an FR of a covered use case has no test, or a tag names
  an item that is not in the specification.
- A scenario the specification leaves open, or the public interface cannot reach, is written as
  `test.fixme` with the question or the reason, instead of being decided in the test.
- Playwright and TypeScript, already used for the end-to-end tests: project `acceptance`,
  `npm run test:acceptance`. No Cucumber or other new framework.
- Screen behaviour stays in `e2e/`. Some e2e tests now check the same rule as a specification;
  that overlap is accepted.

## Consequences

- Whether a use case works as specified can be read from `specs/` and checked with one command.
- `npm run test:e2e` runs the acceptance project as well, so CI and the pre-push hook run it with
  no extra backend start.
- An ambiguity in the specification shows up as a `fixme` that someone has to answer in `spec/`.
- Rules that need time to pass (BR-10) or data in bulk (NFR-UC01.1) cannot be reached through the
  public API; they stay `fixme` until the system offers a way, and the e2e tests cover what the
  sample data allows.
- A new use case adds its specs and its name to the traceability script's list.
