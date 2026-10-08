# Architecture decision records

One file per decision that shapes the code. A record is not edited after it is accepted; a changed
decision gets a new record that names the one it replaces.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-spring-boot-and-nextjs.md) | Backend on Spring Boot, frontend on Next.js | Accepted |
| [0002](0002-repository-layout.md) | `spec/` for the specification, `app/backend/` and `app/frontend/` for the code | Accepted |
| [0003](0003-pull-requests-and-manual-deploy.md) | Changes reach `main` through pull requests; deploys are started by hand | Accepted |
