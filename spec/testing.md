# CareerBridge — Testing

> Part of the CareerBridge specification — see the [index](README.md).

## 9. Testing

How the implemented use cases are tested, and the test cases themselves.

### 9.1 JUnit Testing Summary

Not written yet. What the JUnit tests cover per layer (entities, services, controllers), how many
there are and how they run (on PostgreSQL in Docker, in CI on every pull request), plus the frontend
tests (Vitest) and the end-to-end tests (Playwright).

Each use case is also checked by executable acceptance specifications
([ADR-0011](adr/0011-executable-acceptance-specifications.md)) in `app/frontend/acceptance/`: one
Playwright test per acceptance criterion of the use case (its main scenario, extensions, FRs and the
business rules it cites), written from this specification alone and run against the API with data
each test creates for itself. Each test is tagged with the item it checks (`@FR-UC01.2`, `@BR-9`,
`@UC-01-2b`); `npm run test:traceability`, run in CI, fails when an FR of a covered use case has no
running specification or a tag names an item that is not in the specification. A scenario the
specification leaves open, or the system cannot yet reach, is a `test.fixme` that states the
question or the reason. They run with `npm run test:acceptance` and are part of `npm run test:e2e`.
UC-01 is covered so far.

### 9.2 Test Cases

Not written yet. At least one test case per implemented feature, in the template's columns; the
Actual Result is left empty until the case has run.

| Test Case ID | Assigned Tester | Scenario/Condition | Test Inputs | Expected Result | Actual Result | Test Status |
| --- | --- | --- | --- | --- | --- | --- |
