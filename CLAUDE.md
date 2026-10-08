# CareerBridge — rules for working in this repository

A web-based recruiting and application management system (a multi-organization job board), the
semester project of team CareerBridge for CSI 5324 Software Engineering (Baylor, Fall 2026).

## Where things are

- [spec/](spec/README.md) — the specification, current version: requirements, use cases, SSDs and
  operation contracts, domain model, design, architecture, ADRs.
- [app/backend/](app/backend/) — Spring Boot 4, Java 17, Maven, Spring Data JPA, H2, JUnit.
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
- A decision that shapes the code gets a record in [spec/adr/](spec/adr/README.md).
- Documents are written in English. Never add Claude/AI attribution to commits or pull requests.
