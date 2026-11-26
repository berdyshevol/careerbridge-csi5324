# CareerBridge — application

The backend is in [backend/](backend/), the frontend in [frontend/](frontend/). How the code is laid out (the layers, how the specification maps to code, UC-01 as the worked example) is in [spec/architecture.md](../spec/architecture.md). The rules a change has to follow are in [CLAUDE.md](../CLAUDE.md).

## Run locally

Two terminals:

```bash
cd app/backend
./mvnw spring-boot:run        # backend on http://localhost:8080
```

A recruiter works on the postings of the organizations they are an Active member of. One with several
works in the organization named by the optional `RECRUITER_ORGANIZATION`, or else the one joined first,
until the header gets its organization switcher (UC-09).

```bash
cd app/frontend
npm install
npm run dev                   # frontend on http://localhost:3000
```

Open <http://localhost:3000>. The backend works on the shared Neon `dev` database when `app/backend/.env` exists (copy `.env.example` and ask Oleg for the values), and on an in-memory H2 database when it does not ([ADR-0009](../spec/adr/0009-postgresql-on-neon.md)); the H2 console is then at <http://localhost:8080/h2-console> (JDBC URL `jdbc:h2:mem:careerbridge`, user `sa`, no password). `./mvnw test` in `app/backend` runs the backend tests on PostgreSQL in Docker; when Docker is not running they run on in-memory H2 instead, and the pull request checks PostgreSQL.

Every database has one demo account per role ([ADR-0010](../spec/adr/0010-log-in-with-jwt.md)), plus nine numbered ones for demos. Every one of them logs in with `Baylor@2026`: on the in-memory H2 database that is the default, and on Neon the `DEMO_*_PASSWORD` settings (in `.env` and on Render) hold the same value.

| Role | Email | Password |
| --- | --- | --- |
| Applicant with three applications | `jordan.lee@example.com` | `Baylor@2026` |
| Applicant with none | `sam.rivera@example.com` | `Baylor@2026` |
| Recruiter | `riley.chen@example.com` | `Baylor@2026` |
| Administrator | `admin@careerbridge.example` | `Baylor@2026` |
| Applicants with none, for demos | `applicant1@example.com` to `applicant3@example.com` | `Baylor@2026` |
| Recruiters, for demos | `recruiter1@example.com` to `recruiter6@example.com` | `Baylor@2026` |

The numbered accounts share `DEMO_NUMBERED_PASSWORD` on Neon. On H2, recruiter1 and recruiter2, like Riley, are members of Brazos Analytics and Waco Health Partners; recruiter3 to recruiter6 each belong to one sample organization (Pixel Labs, Lone Star Robotics, Cloud Nine Software, Green Grid Energy) and created its postings (`data/jobs.csv`).

Log in at <http://localhost:3000/login>; posting approvals are at <http://localhost:3000/admin/postings> for the Administrator.

## Deployment

Deploying is a button: on GitHub open **Actions → Deploy → Run workflow** (branch `main`). A failed Render build turns the run red. Why a deploy is started by hand: [ADR-0003](../spec/adr/0003-pull-requests-and-manual-deploy.md).

- **Frontend:** <https://careerbridge-csi5324.vercel.app> (Vercel, project `careerbridge-csi5324`, root `app/frontend`).
- **Backend:** <https://careerbridge-api-et18.onrender.com/api/postings> (Render, service `careerbridge-api`, root `app/backend`, built from the `Dockerfile` there). Its database is the Neon branch `main`, set in Render's environment as `DATABASE_URL`, `DATABASE_USERNAME` and `DATABASE_PASSWORD`.

The frontend finds the backend through `NEXT_PUBLIC_API_URL`; the backend allows the frontend addresses listed in `careerbridge.frontend-origins` (`application.properties`). Render's free plan puts the backend to sleep after 15 minutes without requests, and the next request waits about a minute; before a demo, open the site a minute or two early.

**Looking at a branch before it is merged:** Actions → Preview → Run workflow, leave "Use workflow from" on `main`, type your branch name. Oleg approves the run, and in a couple of minutes the link to a temporary copy of the frontend appears on your pull request.

The workflows (`.github/workflows/deploy.yml`, `preview.yml`) read two secrets, `VERCEL_TOKEN` and `RENDER_DEPLOY_HOOK_URL`, from the GitHub environments `deploy` and `preview`, which only runs from `main` can use. The Vercel ids are repository variables.

## Pull request checks

Besides the tests, every pull request runs three workflows, whatever branch it goes into, so a pull request stacked on another one is checked and moves its ticket too:

- **Ticket** (`pr-ticket.yml`) fails a title without `SCRUM-NN`.
- **Jira** (`jira-sync.yml`) moves that ticket to In Review when the pull request opens and to Done when it merges.
- **Claude review** (`claude-review.yml`) posts one comment per run: bugs, the ticket, the specification and ADRs, and the screen rules read from the code. Its check turns red when the comment lists a must-fix item, or when the review left no verdict; it is not a required check, so a person can still merge when the model is wrong. It runs when the pull request opens; re-run it from the Actions tab after a fix or larger changes. It is no screen review: for a page, `screen-review` with its screenshots is still needed.

They read three repository secrets: `JIRA_EMAIL` and `JIRA_API_TOKEN` (an Atlassian API token; status changes appear under that account) and `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`, Oleg's Claude subscription). Unlike the deploy secrets, these are readable by the workflow copy on any collaborator's branch, which is accepted while the collaborators are the team ([ADR-0008](../spec/adr/0008-pull-requests-name-their-ticket.md)).

## Documentation PDF

`tools/build-pdf/build.sh <list.txt> <output.pdf>` builds a deliverable's documentation from the
Markdown in `spec/`, Mermaid diagrams included ([tools/build-pdf/README.md](../tools/build-pdf/README.md)).
