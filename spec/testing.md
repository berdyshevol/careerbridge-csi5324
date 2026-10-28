# CareerBridge — Testing

> Part of the CareerBridge specification — see the [index](README.md).

## 9. Testing

How the implemented use cases are tested, and the test cases themselves.

### 9.1 JUnit Testing Summary

Not written yet. What the JUnit tests cover per layer (entities, services, controllers), how many
there are and how they run (on PostgreSQL in Docker, in CI on every pull request), plus the frontend
tests (Vitest) and the end-to-end tests (Playwright).

Use cases are also checked by executable acceptance specifications in `app/frontend/acceptance/`
([ADR-0011](adr/0011-executable-acceptance-specifications.md)): `npm run test:acceptance` runs them,
and `npm run test:traceability`, run in CI, checks that their tags name items of this specification.

### 9.2 Test Cases

Not written yet. At least one test case per implemented feature, in the template's columns; the
Actual Result is left empty until the case has run.

| Test Case ID | Assigned Tester | Scenario/Condition | Test Inputs | Expected Result | Actual Result | Test Status |
| --- | --- | --- | --- | --- | --- | --- |
