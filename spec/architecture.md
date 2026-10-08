# CareerBridge — Architecture

> Part of the CareerBridge specification — see the [index](README.md). How to run and deploy the
> application is in [app/README.md](../app/README.md).

## 8. Implementation Overview

### Two parts

| Part | Folder | Technology | Responsibility |
| --- | --- | --- | --- |
| Backend | `app/backend/` | Java 17, Spring Boot 4, Maven, Spring Data JPA, H2 | Business rules and data. Serves JSON under `/api`; has no pages. |
| Frontend | `app/frontend/` | Next.js (TypeScript), Tailwind, daisyUI | Pages for phone, tablet and laptop. Holds no business rules; it calls the backend. |

The browser loads pages from the frontend. The frontend reads data from the backend over HTTP and
JSON. The backend lists the frontend addresses that may call it (CORS).

### Backend layers

A layer calls only the layer below it.

| Layer | Package | Responsibility |
| --- | --- | --- |
| Controller | `controller` | Maps a URL under `/api` to one service call and returns JSON |
| Service | `service` | Business rules; one method per system operation of the operation contracts |
| Repository | `repository` | Spring Data JPA interfaces |
| Model | `model` | Entities, named as in the [domain model](domain-model.md) |

### Data

An in-memory H2 database. At startup the backend loads sample job postings from a CSV file
(`app/backend/src/main/resources/data/jobs.csv`); every restart starts from that file again.

### From specification to code

| Specification | Code |
| --- | --- |
| Conceptual class and its attributes ([domain model](domain-model.md)) | Entity in `model`, same names |
| System operation ([operation contract](ssd-and-contracts.md)) | Method of a service, same name |
| Posting lifecycle state ([use-cases.md](use-cases.md), Figure 4) | Value of the `PostStatus` enum |
| Use case | A controller, a service, a page under `app/frontend/src/app/` |

UC-04 Apply for Job has its screen and its checks on the frontend, against sample data, until the backend implements CO-04.1.

UC-01 Browse Job Postings is implemented end to end: page → `lib/api.ts` → `JobPostingController`
(`/api/postings`) → `JobPostingService` (`searchPostings`, `viewPosting`) → `JobPostingRepository` → H2.

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
