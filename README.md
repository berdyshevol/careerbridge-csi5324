# CareerBridge

A recruiting and application management system: a job board where many organizations publish
postings and applicants apply across them. Recruiters register with their organization, create
postings and screen applications; an administrator approves organizations and postings. Semester
project of team CareerBridge for CSI 5324 Software Engineering (Baylor University, Fall 2026).

- **Live application:** <https://careerbridge-csi5324.vercel.app> (the backend sleeps after 15 minutes
  without requests; the first page then takes about a minute)
- **Scrum board:** <https://careerbridge-csi5324.atlassian.net/jira/software/projects/SCRUM/boards/1>

## Repository structure

| Folder | What it holds |
| --- | --- |
| [spec/](spec/README.md) | The specification, kept current with the code: [use cases](spec/use-cases.md), [requirements](spec/requirements.md), [domain model](spec/domain-model.md), [design](spec/design.md) (sequence and class diagrams), [architecture](spec/architecture.md), [testing](spec/testing.md) and [decision records](spec/adr/README.md). Its README says which file holds what. |
| [spec/screens/](spec/screens/README.md) | One mockup per screen; every page is built to its mockup. |
| [spec/user-scenarios/](spec/user-scenarios/README.md) | Acceptance scenarios in Gherkin, one per use-case outcome. |
| [app/backend/](app/backend/) | Spring Boot 4, Java 17, Maven, Spring Data JPA; PostgreSQL on Neon. |
| [app/frontend/](app/frontend/) | Next.js (TypeScript), Tailwind and daisyUI. |
| [tools/build-pdf/](tools/build-pdf/README.md) | Builds the documentation PDF from `spec/`. |
| [.github/workflows/](.github/workflows/) | Tests on every pull request, the deploy button, ticket checks. |

## Run it locally

You need **Java 17**, **Node.js 22** and **Git**. Docker is optional (the backend tests use it for
PostgreSQL when it runs). Then, in two terminals:

```bash
cd app/backend
./mvnw spring-boot:run        # backend on http://localhost:8080
```

```bash
cd app/frontend
npm install
npm run dev                   # frontend on http://localhost:3000
```

Open <http://localhost:3000>. Without further setup the backend uses an **in-memory H2 database**
loaded with sample organizations, postings and applications, so nothing else has to be installed.
With a file `app/backend/.env` (copied from `.env.example`, values from Oleg) it uses the team's
shared PostgreSQL database on Neon instead.

Every demo account logs in with the password **`Baylor@2026`**, for example
`admin@careerbridge.example` (administrator), `riley.chen@example.com` (recruiter) and
`jordan.lee@example.com` (applicant); the full list is in [app/README.md](app/README.md).

The detailed guide — the databases, demo accounts, deployment to Vercel and Render, and the
pull request checks — is [app/README.md](app/README.md).

## Tests

Four kinds of tests run on every pull request and must pass before it is merged:

| Kind | What it checks | Where | About | Run |
| --- | --- | --- | --- | --- |
| **JUnit** | Backend services, controllers, access by role | `app/backend/src/test/` | 266 tests | `cd app/backend && ./mvnw test` |
| **Vitest** with React Testing Library | Frontend components, pages and the API client | `app/frontend/src/**/*.test.ts(x)` | 280 tests | `cd app/frontend && npm test` |
| **Playwright** end to end | Each use case's main flow in a real browser, at laptop and phone width | `app/frontend/e2e/*.spec.ts` | 15 files | `cd app/frontend && npm run test:e2e` |
| **Gherkin scenarios** (playwright-bdd) | Each use-case outcome, written in plain English, against the running system | `spec/user-scenarios/*.feature` | 29 scenarios | the same `npm run test:e2e` |

Before the first end-to-end run: `cd app/frontend && npx playwright install chromium`. The end-to-end
run starts its own backend on a fresh database and its own frontend, so port 8080 must be free.

## Contributing

Every change has a Jira ticket and reaches `main` through a pull request whose title starts with
the key, `SCRUM-NN …`; the tests must pass, and the ticket moves to In Review and Done by itself
([ADR-0008](spec/adr/0008-pull-requests-name-their-ticket.md)). The rules for the code are in
[CLAUDE.md](CLAUDE.md).
