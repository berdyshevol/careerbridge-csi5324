# CareerBridge — application

Two parts, side by side:

- **Backend** ([backend/](backend/)): Spring Boot 4, Java 17, Maven, Spring Data JPA, in-memory H2. It serves JSON only. Inside, it is laid out like Design Studio 4.
- **Frontend** ([frontend/](frontend/)): Next.js with Tailwind and daisyUI. It draws the pages and calls the backend.

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

## Backend layers

Packages under `backend/src/main/java/baylor/csi5324/careerbridge/`. A layer only calls the one below it.

| Layer | Package | Does |
| --- | --- | --- |
| Controller | `controller` | `@RestController`: maps a URL under `/api` to a service call and returns JSON |
| Service | `service` | Business rules; one method per system operation in the operation contracts |
| Repository | `repository` | Spring Data JPA interfaces |
| Model | `model` | Entities, named as in the domain model (documentation, section 5) |

`util` holds helper classes (`CsvReader`). `config/SampleDataLoader` fills the empty database from `backend/src/main/resources/data/jobs.csv` at startup; `config/WebConfig` lets the frontend call the API from the browser.

## Naming follows the documentation

- **Classes and attributes** come from the domain model: `JobPosting.jobPostId`, `applicationDeadline`, `postStatus`, `Organization.name`.
- **Service methods** are the system operations from the SSDs and contracts: `searchPostings` (CO-01.1), `viewPosting` (CO-01.2).
- **`PostStatus`** has the states of the job posting lifecycle (Figure 4): Draft, Pending Approval, Returned, Published, Closed, Rejected, Expired.

Keep it that way: if code and documentation disagree, fix one of them in the same pull request.

## Worked example

UC-01 Browse Job Postings is wired end to end:
`frontend/src/app/jobs/page.tsx` → `frontend/src/lib/api.ts` → `JobPostingController` (`/api/postings`) → `JobPostingService` → `JobPostingRepository` → H2.

Only Published postings whose deadline has not passed are listed (BR-9, BR-10). A posting that was published and then closed can still be opened and says it no longer accepts applications.

## Adding your use case

1. Backend: add your entities to `model` (names from the domain model), a repository interface, a service with one method per system operation in your contracts, and a `@RestController`.
2. Add a JUnit test for your service (see `JobPostingServiceTest`).
3. Frontend: add your calls to `frontend/src/lib/api.ts` and replace your stub page (see [frontend/README.md](frontend/README.md)).
4. Work in your own branch and open a pull request.

## Deployment

Deploying is a button: on GitHub open **Actions → Deploy → Run workflow** (branch `main`). It runs every check, then deploys both parts. Nothing deploys by itself.

- **Frontend:** <https://careerbridge-csi5324.vercel.app> (Vercel, project `careerbridge-csi5324`, root `app/frontend`).
- **Backend:** <https://careerbridge-api-et18.onrender.com/api/postings> (Render, service `careerbridge-api`, root `app/backend`, built from the `Dockerfile` there).

The frontend finds the backend through `NEXT_PUBLIC_API_URL`; the backend allows the frontend addresses listed in `careerbridge.frontend-origins` (`application.properties`). Render's free plan sleeps when idle, so the first request after a pause takes about a minute. The database is in memory: every restart reloads `jobs.csv`.

**Looking at a branch before it is merged:** Actions → Preview → Run workflow, leave "Use workflow from" on `main`, type your branch name. Oleg approves the run, and in a couple of minutes the link to a temporary copy of the frontend appears on your pull request. It talks to the live backend, so backend changes in your branch are not in it.

The workflows (`.github/workflows/deploy.yml`, `preview.yml`) read two secrets, `VERCEL_TOKEN` and `RENDER_DEPLOY_HOOK_URL`, from the GitHub environments `deploy` and `preview`, which only runs from `main` can use; a preview also waits for the repository owner's approval. The Vercel ids are repository variables.
