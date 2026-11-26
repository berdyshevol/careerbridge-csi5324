# CareerBridge

A recruiting and application management system: a job board where many organizations publish
postings and applicants apply across them. Recruiters register with their organization, create
postings and screen applications; an administrator approves organizations and postings. Semester
project of team CareerBridge for CSI 5324 Software Engineering (Baylor University, Fall 2026).

- **Live application:** <https://careerbridge-csi5324.vercel.app> (the backend sleeps after 15 minutes
  without requests; the first page then takes about a minute)
- **Team website:** <https://careerbridge-csi5324.vercel.app/about> (the team, its roles and use cases, and the project links)
- **Scrum board:** <https://careerbridge-csi5324.atlassian.net/jira/software/projects/SCRUM/boards/1>

## Repository structure

| Folder | What it holds |
| --- | --- |
| [spec/](spec/README.md) | The specification of the project, kept current with the code. [spec/README.md](spec/README.md) says which file holds what. |
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

The step-by-step guide — tools, configuration, tests and troubleshooting — is the
[Setup / Installation Guide](spec/setup-guide.md) (section 11 of the documentation). Deployment to
Vercel and Render and the pull request checks are in [app/README.md](app/README.md).

## Tests

Four kinds of tests run on every pull request and must pass before it is merged: JUnit (backend),
Vitest (frontend), Playwright end to end, and Gherkin acceptance scenarios. How to run them:
[Setup Guide §11.4](spec/setup-guide.md#114-running-the-tests).
