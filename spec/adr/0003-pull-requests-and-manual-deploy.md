# ADR-0003: Pull requests into `main`, deploys started by hand

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

Five people commit to one repository, and the commit history is graded per member. The hosting
plans in use are free ones.

## Decision

- Nobody pushes to `main` directly. A change arrives through a pull request, merged with a merge
  commit so each member's commits stay visible.
- Every pull request runs the backend tests, the frontend lint, tests and build, and the
  end-to-end tests. They must pass before merging. A review by another member is not required yet.
- Nothing deploys automatically. The **Deploy** workflow is started by hand from `main`; it runs
  the same tests, then deploys the frontend to Vercel and the backend to Render, and waits until
  the live backend reports the deployed commit.
- The **Preview** workflow publishes a temporary copy of the frontend for a branch, after the
  repository owner approves the run.

## Consequences

- `main` always passes its tests and can be deployed at any time.
- A deploy is a deliberate step, so the public site changes only when someone decides it should.
- A preview shows frontend changes only; it talks to the live backend.
