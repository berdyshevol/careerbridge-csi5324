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

## Layers

Each use case goes through the same layers, top to bottom. A layer only calls the one below it.

| Layer | Folder | Does |
| --- | --- | --- |
| UI | `src/app/**/page.js`, `src/components/` | Screens and shared components |
| API route | `src/app/api/**/route.js` | Maps a URL to a controller function, nothing else |
| Controller | `src/controllers/` | Reads the request, calls a service, builds the response |
| Service | `src/services/` | Business rules; no HTTP, no file access |
| Repository | `src/repositories/` | Reads and writes data |
| Model | `src/models/` | Classes from the domain model |

Helpers shared by several layers live in `src/utils/`. Sample data lives in `data/` (`jobs.csv`).

## Worked example

Job postings are wired end to end:
`src/app/jobs/page.js` → `jobPostingService` → `jobPostingRepository` → `data/jobs.csv`, and the same service is exposed at `/api/jobs` and `/api/jobs/:id` through `jobPostingController`.

## Adding your use case

1. Find your stub page (the home page lists them with owners) and replace `<Placeholder />` with your screen.
2. Add the model, repository, service and controller files your use case needs, following the job postings example.
3. Add an API route under `src/app/api/` that calls your controller.
4. Work in your own branch and open a pull request.
