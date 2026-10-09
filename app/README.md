# CareerBridge — application

Two parts, side by side:

- **Backend** ([backend/](backend/)): Spring Boot 4, Java 17, Maven, Spring Data JPA, in-memory H2. It serves JSON only. Inside, it is laid out like Design Studio 4.
- **Frontend** ([frontend/](frontend/)): Next.js with Tailwind and daisyUI. It draws the pages and calls the backend.

How the code is laid out (the layers, how the specification maps to code, UC-01 as the worked example) is in [spec/architecture.md](../spec/architecture.md). The rules a change has to follow are in [CLAUDE.md](../CLAUDE.md).

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

- `SKIP_E2E=1 git push` skips the end-to-end tests (they take about a minute and need ports 3000 and 8080).
- The same checks run on every pull request into `main`.

## Jira from Claude Code

The repository carries the address of the Jira server for Claude Code (`.mcp.json`), so nobody has to configure it.

1. Open Claude Code in the repository folder. The first time it asks whether to use the `atlassian` server: say yes.
2. Type `/mcp`, choose `atlassian` and sign in with your Atlassian account in the browser. Once per computer.
3. Then ask in plain words: "show my cards in the current sprint", "implement SCRUM-69", "move SCRUM-69 to Done".

Claude acts in Jira as you, with your permissions. Nothing secret is stored in the repository.

## Deployment

Deploying is a button: on GitHub open **Actions → Deploy → Run workflow** (branch `main`). It runs every check, then deploys both parts. Nothing deploys by itself. The backend job waits until the live backend reports the new commit at `/api/version`, so a failed Render build turns the run red.

- **Frontend:** <https://careerbridge-csi5324.vercel.app> (Vercel, project `careerbridge-csi5324`, root `app/frontend`).
- **Backend:** <https://careerbridge-api-et18.onrender.com/api/postings> (Render, service `careerbridge-api`, root `app/backend`, built from the `Dockerfile` there).

The frontend finds the backend through `NEXT_PUBLIC_API_URL`; the backend allows the frontend addresses listed in `careerbridge.frontend-origins` (`application.properties`). Render's free plan sleeps when idle; the `Keep backend awake` workflow pings the backend every 10 minutes so visitors do not wait for it to wake up. The database is in memory: every restart reloads `jobs.csv`.

**Looking at a branch before it is merged:** Actions → Preview → Run workflow, leave "Use workflow from" on `main`, type your branch name. Oleg approves the run, and in a couple of minutes the link to a temporary copy of the frontend appears on your pull request. It talks to the live backend, so backend changes in your branch are not in it.

The workflows (`.github/workflows/deploy.yml`, `preview.yml`) read two secrets, `VERCEL_TOKEN` and `RENDER_DEPLOY_HOOK_URL`, from the GitHub environments `deploy` and `preview`, which only runs from `main` can use; a preview also waits for the repository owner's approval. The Vercel ids are repository variables.
