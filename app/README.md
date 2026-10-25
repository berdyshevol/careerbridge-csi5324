# CareerBridge — application

The backend is in [backend/](backend/), the frontend in [frontend/](frontend/). How the code is laid out (the layers, how the specification maps to code, UC-01 as the worked example) is in [spec/architecture.md](../spec/architecture.md). The rules a change has to follow are in [CLAUDE.md](../CLAUDE.md).

## Run locally

Two terminals:

```bash
cd app/backend
./mvnw spring-boot:run        # backend on http://localhost:8080
```

```bash
cd app/frontend
npm install
npm run dev                   # frontend on http://localhost:3000
```

Open <http://localhost:3000>. The backend works on the shared Neon `dev` database when `app/backend/.env` exists (copy `.env.example` and ask Oleg for the values), and on an in-memory H2 database when it does not ([ADR-0009](../spec/adr/0009-postgresql-on-neon.md)); the H2 console is then at <http://localhost:8080/h2-console> (JDBC URL `jdbc:h2:mem:careerbridge`, user `sa`, no password). `./mvnw test` in `app/backend` runs the backend tests on PostgreSQL in Docker, so Docker must be running.

Every database has one demo account per role ([ADR-0010](../spec/adr/0010-log-in-with-jwt.md)). On the in-memory H2 database their passwords are the ones below; on Neon they come from `DEMO_*_PASSWORD` in `.env` (Oleg hands them out).

| Role | Email | Password on H2 |
| --- | --- | --- |
| Applicant with three applications | `jordan.lee@example.com` | `Applicant-local-1` |
| Applicant with none | `sam.rivera@example.com` | `Applicant-local-2` |
| Recruiter | `riley.chen@example.com` | `Recruiter-local-1` |
| Administrator | `admin@careerbridge.example` | `Administrator-local-1` |

Log in at <http://localhost:3000/login>; posting approvals are at <http://localhost:3000/admin/postings> for the Administrator.

## Deployment

Deploying is a button: on GitHub open **Actions → Deploy → Run workflow** (branch `main`). A failed Render build turns the run red. Why a deploy is started by hand: [ADR-0003](../spec/adr/0003-pull-requests-and-manual-deploy.md).

- **Frontend:** <https://careerbridge-csi5324.vercel.app> (Vercel, project `careerbridge-csi5324`, root `app/frontend`).
- **Backend:** <https://careerbridge-api-et18.onrender.com/api/postings> (Render, service `careerbridge-api`, root `app/backend`, built from the `Dockerfile` there). Its database is the Neon branch `main`, set in Render's environment as `DATABASE_URL`, `DATABASE_USERNAME` and `DATABASE_PASSWORD`.

The frontend finds the backend through `NEXT_PUBLIC_API_URL`; the backend allows the frontend addresses listed in `careerbridge.frontend-origins` (`application.properties`). Render's free plan sleeps when idle; the `Keep backend awake` workflow pings the backend every 10 minutes so visitors do not wait for it to wake up.

**Looking at a branch before it is merged:** Actions → Preview → Run workflow, leave "Use workflow from" on `main`, type your branch name. Oleg approves the run, and in a couple of minutes the link to a temporary copy of the frontend appears on your pull request.

The workflows (`.github/workflows/deploy.yml`, `preview.yml`) read two secrets, `VERCEL_TOKEN` and `RENDER_DEPLOY_HOOK_URL`, from the GitHub environments `deploy` and `preview`, which only runs from `main` can use. The Vercel ids are repository variables.

## Pull request checks

Besides the tests, every pull request to `main` runs three workflows:

- **Ticket** (`pr-ticket.yml`) fails a title without `SCRUM-NN`.
- **Jira** (`jira-sync.yml`) moves that ticket to In Review when the pull request opens and to Done when it merges.
- **Claude review** (`claude-review.yml`) posts one advisory comment per run: bugs, the ticket, the specification and ADRs, and the screen rules read from the code. It runs when the pull request opens; re-run it from the Actions tab after larger changes. It is no screen review: for a page, `screen-review` with its screenshots is still needed.

They read three repository secrets: `JIRA_EMAIL` and `JIRA_API_TOKEN` (an Atlassian API token; status changes appear under that account) and `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`, Oleg's Claude subscription). Unlike the deploy secrets, these are readable by the workflow copy on any collaborator's branch, which is accepted while the collaborators are the team ([ADR-0008](../spec/adr/0008-pull-requests-name-their-ticket.md)).
