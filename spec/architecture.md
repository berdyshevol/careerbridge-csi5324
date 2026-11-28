# CareerBridge — Architecture

> Part of the CareerBridge specification — see the [index](README.md). How to run and deploy the
> application is in [app/README.md](../app/README.md).

## 8. Implementation Overview

### Two parts

| Part | Folder | Technology | Responsibility |
| --- | --- | --- | --- |
| Backend | `app/backend/` | Java 17, Spring Boot 4, Maven, Spring Data JPA, PostgreSQL | Business rules and data. Serves JSON under `/api`; has no pages. |
| Frontend | `app/frontend/` | Next.js (TypeScript), Tailwind, daisyUI | Pages for phone, tablet and laptop. Holds no business rules; it calls the backend. |

The browser loads pages from the frontend. The frontend reads data from the backend over HTTP and
JSON. The backend lists the frontend addresses that may call it (CORS).

### Backend layers

A layer calls only the layer below it, only a controller knows about HTTP, and only a lifecycle
table changes a status, fired by a service (or by the sample data in `config`). The test
`LayersTest` (`app/backend/src/test`) checks all three on every pull request.

| Layer | Package | Responsibility |
| --- | --- | --- |
| Controller | `controller` | Maps a URL under `/api` to one service call and returns JSON |
| Service | `service` | One method per system operation of the operation contracts: checks what needs a query, loads and locks, fires the operation on the lifecycle table, saves |
| Repository | `repository` | Spring Data JPA interfaces |
| Lifecycle | `lifecycle` | One transition table per lifecycle, run by `StateMachine`: each row is an arrow of the figure with its refusals and its effect ([ADR-0015](adr/0015-lifecycles-are-transition-tables.md)); plain Java, no Spring |
| Model | `model` | Entities, named as in the [domain model](domain-model.md); their status is written only by a lifecycle table |

Controllers and services also use the records in the `dto` package, which is not a layer. A record
there is the shape of one request or one response:

- **Request record:** when the client sends a set of fields and the server must set the others
  itself (an id, a status, a date, the owner). `CreateJobPostingRequest` is the first one: a new
  posting gets its status and its date from the service, never from the client.
- **Response record:** when a screen shows data from several classes, or the actor must not see
  every attribute of the entity (for example another user's contact details). Postings always go
  out as one: `PublicPosting` on the public board, `PostingResponse` to the recruiter and the
  administrator, so a field added to `JobPosting` stays inside until a record names it.
- **No record:** when an operation takes only an id, a token, a keyword or one value, the
  controller reads it from the path or the query; when an entity has nothing to hide, the
  controller returns it as it is.

### Data

PostgreSQL on Neon ([ADR-0009](adr/0009-postgresql-on-neon.md)); the tests use PostgreSQL in Docker,
and a backend started without `DATABASE_URL` falls back to in-memory H2. The tables come from the Flyway
migrations in `app/backend/src/main/resources/db/migration`
([ADR-0014](adr/0014-schema-from-flyway-migrations.md)). Into an empty database the
backend loads sample job postings and applications from CSV files
(`app/backend/src/main/resources/data/`).

### From specification to code

| Specification | Code |
| --- | --- |
| Conceptual class and its attributes ([domain model](domain-model.md)) | Entity in `model`, same names |
| System operation ([operation contract](ssd-and-contracts.md)) | Method of a service, same name |
| Application pipeline ([use-cases.md](use-cases.md), Figure 3, BR-8) | `ApplicationLifecycle.TABLE`; the stages are values of `ApplicationStatus` |
| Posting lifecycle ([use-cases.md](use-cases.md), Figure 4) | `JobPostingLifecycle.TABLE`; the states are values of `PostStatus` |
| Use case | A controller, a service, a page under `app/frontend/src/app/` |

UC-04 Apply for Job is implemented end to end: `ApplyForm` → `lib/api.ts` → `ApplicationController`
(`GET` and `POST /api/postings/{postingId}/application`) → `ApplicationService` (`startApplication`,
`submitApplication`). The applicant is the logged-in Applicant (the token's subject, ADR-0010), and the
resume is the one that Applicant has on file (UC-03), so neither request carries one. The confirmation Notification of CO-04.1 comes with the
Notification Service.

UC-01 Search Job Postings is implemented end to end: page → `lib/api.ts` → `JobPostingController`
(`/api/postings`) → `JobPostingService` (`searchPostings`) → `JobPostingRepository` → PostgreSQL. The
same controller and service open one posting (`viewPosting`), the operation UC-04 starts from.

### Tests

| Level | Tool | Where |
| --- | --- | --- |
| Backend unit and service tests | JUnit | `app/backend/src/test/` |
| Frontend unit and component tests | Vitest, React Testing Library | `app/frontend/src/**/*.test.ts(x)` |
| End to end, through the browser | Playwright (headless; laptop and phone sizes) | `app/frontend/e2e/` |

All three run on every pull request into `main` and before every `git push`.

### Deployment

The frontend runs on Vercel, the backend on Render (built from `app/backend/Dockerfile`). A deploy
is started by hand from GitHub Actions and runs the tests first
([ADR-0003](adr/0003-pull-requests-and-manual-deploy.md)).
