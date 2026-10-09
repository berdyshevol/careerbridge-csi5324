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

Open <http://localhost:3000>. `./mvnw test` in `app/backend` runs the backend tests. The H2 console is at <http://localhost:8080/h2-console> (JDBC URL `jdbc:h2:mem:careerbridge`, user `sa`, no password).

## Tests run before every push

After `npm install` in `app/frontend`, git runs the tests on `git push` (a husky pre-push hook): backend JUnit, frontend lint and Vitest, then Playwright end-to-end. A failing test stops the push. A push that changes nothing under `app/` skips them.

`SKIP_E2E=1 git push` skips the end-to-end tests (they take about a minute and need ports 3000 and 8080).

## Deployment

Deploying is a button: on GitHub open **Actions → Deploy → Run workflow** (branch `main`). A failed Render build turns the run red. Why a deploy is started by hand: [ADR-0003](../spec/adr/0003-pull-requests-and-manual-deploy.md).

- **Frontend:** <https://careerbridge-csi5324.vercel.app> (Vercel, project `careerbridge-csi5324`, root `app/frontend`).
- **Backend:** <https://careerbridge-api-et18.onrender.com/api/postings> (Render, service `careerbridge-api`, root `app/backend`, built from the `Dockerfile` there).

The frontend finds the backend through `NEXT_PUBLIC_API_URL`; the backend allows the frontend addresses listed in `careerbridge.frontend-origins` (`application.properties`). Render's free plan sleeps when idle; the `Keep backend awake` workflow pings the backend every 10 minutes so visitors do not wait for it to wake up.

**Looking at a branch before it is merged:** Actions → Preview → Run workflow, leave "Use workflow from" on `main`, type your branch name. Oleg approves the run, and in a couple of minutes the link to a temporary copy of the frontend appears on your pull request.

The workflows (`.github/workflows/deploy.yml`, `preview.yml`) read two secrets, `VERCEL_TOKEN` and `RENDER_DEPLOY_HOOK_URL`, from the GitHub environments `deploy` and `preview`, which only runs from `main` can use. The Vercel ids are repository variables.
