# CareerBridge — application

Next.js (JavaScript) app. Requires Node.js 20 or newer.

Live preview: <https://careerbridge-eight.vercel.app>

## Run locally

```bash
cd app
npm install
npm run dev
```

Open <http://localhost:3000>. `npm run lint` checks the code; `npm run build` makes a production build.

## How it is built

The API is assembled from configuration. Business code never touches Next.js: one adapter reads a map of endpoints and serves them.

| Part | Folder | Does |
| --- | --- | --- |
| UI | `src/app/**/page.js`, `src/components/` | Screens and shared components |
| Adapter | `src/framework/nextAdapter.js` | The only file that handles Next.js requests; serves the endpoint map |
| Endpoints | `src/endpoints/` | Plain objects: path, method, access, roles, handler, errors |
| Auth provider | `src/auth/` | `restoreSession`, `startSession`, `endSession`; a test applicant for now |
| Service | `src/services/` | Business rules; receives repositories, throws `DomainError` |
| Repository | `src/repositories/` | Reads and writes data |
| Model | `src/models/` | Classes from the domain model |

Everything is wired in three small files: `src/repositories/index.js` → `src/services/index.js` → `src/endpoints/index.js`. `src/app/api/[...path]/route.js` hands the result to the adapter.

Helpers shared by several parts live in `src/utils/`. Sample data lives in `data/` (`jobs.csv`).

## An endpoint

```js
{
  path: "/:id",
  method: "GET",
  access: "public",          // or "private": needs a session
  roles: ["Applicant"],      // optional
  handler: ({ params }) => domain.jobs.getById(params.id),
}
```

The handler receives `{ body, query, params, auth }` and returns data.

## Errors

To fail, a service throws `new DomainError(code, message)`. The adapter turns it into a response: the code picks the HTTP status and the message is sent to the client.

| Code | Status |
| --- | --- |
| `VALIDATION_ERROR` | 400 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |

For any other code, add it to the endpoint: `errors: { APPLICATION_LIMIT_REACHED: { code: 409 } }` (an optional `message` replaces the service's text). Anything that is not a `DomainError` becomes a plain 500 and is only logged on the server.

## Worked example

Job postings are wired end to end: `data/jobs.csv` → `jobPostingRepository` → `jobPostingService` → `endpoints/jobs.js`, served at `/api/jobs` and `/api/jobs/:id`. The page `src/app/jobs/page.js` calls the same service directly. `/api/auth/me` shows a private endpoint.

## Adding your use case

1. Find your stub page (the home page lists them with owners) and replace `<Placeholder />` with your screen.
2. Add your model and repository, and register the repository in `src/repositories/index.js`.
3. Add your service as a factory (`createXService({ repositories })`) and register it in `src/services/index.js`.
4. Add your endpoints in `src/endpoints/<name>.js` and register them in `src/endpoints/index.js`. No new route files.
5. Work in your own branch and open a pull request.
