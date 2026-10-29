# CareerBridge — rules for working in this repository

A web-based recruiting and application management system (a multi-organization job board), the
semester project of team CareerBridge for CSI 5324 Software Engineering (Baylor, Fall 2026).

## Where things are

- [spec/](spec/README.md) — the specification, current version: requirements, use cases, SSDs and
  operation contracts, domain model, design, architecture, ADRs.
- [app/backend/](app/backend/) — Spring Boot 4, Java 17, Maven, Spring Data JPA, PostgreSQL (Neon), JUnit.
- [app/frontend/](app/frontend/) — Next.js (TypeScript), Tailwind, daisyUI with one theme in `globals.css`.
- How to run, test and deploy: [app/README.md](app/README.md).

## Rules

- **Names follow the specification.** Entities and attributes come from the
  [domain model](spec/domain-model.md); service methods are the system operations of the
  [operation contracts](spec/ssd-and-contracts.md). If code and specification disagree, fix one of
  them in the same pull request.
- **Every use case has tests:** JUnit for the service, Vitest with React Testing Library for the
  frontend, and a headless Playwright test for the main flow.
- **Changes reach `main` through pull requests** with merge commits; the tests must pass
  ([ADR-0003](spec/adr/0003-pull-requests-and-manual-deploy.md)).
- **Every pull request names its ticket:** title `SCRUM-NN …`, branch `<name>/SCRUM-NN-<slug>`. Jira
  moves the ticket itself; nobody moves statuses by hand
  ([ADR-0008](spec/adr/0008-pull-requests-name-their-ticket.md)).
- **Screens follow [ADR-0004](spec/adr/0004-frontend.md) and
  [ADR-0011](spec/adr/0011-screens-are-built-from-mockups.md):** each screen matches its mockup
  `spec/screens/<screen-id>.html` (catalog: "Screens by role" in `spec/ui-drafts.md`), built from
  the blocks on `/styleguide` (`app/frontend/src/app/styleguide/page.tsx`) and `src/components/`,
  theme colors only, checked at phone, tablet and laptop width. A screen that is not in the catalog
  is added there before it is coded. After changing anything under `app/frontend/src/app/` or
  `src/components/`, and before opening its pull request, run the `screen-review` skill and put its
  verdict in the pull request under `## Screens`.
- **To build anything — a task, a slice of a use case or a whole use case — use the
  `implement-task` skill:** it slices a use case into tickets the owner approves, and takes each
  ticket through plan, tests, simplify and review to one pull request.
- **Comments say why, not what.** Write a comment only for what the code cannot show: the reason
  for a choice, or a trap for the next person. Do not restate the code or the specification.
- A decision that shapes the code gets a record in [spec/adr/](spec/adr/README.md).
- Documents are written in English. Never add Claude/AI attribution to commits or pull requests.
