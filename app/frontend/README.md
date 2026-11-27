# CareerBridge — frontend

Next.js (TypeScript) with Tailwind and daisyUI. It needs the backend running; see [../README.md](../README.md).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. `npm run lint` checks the code; `npm run build` makes a production build. To point at another backend, set `NEXT_PUBLIC_API_URL` (default `http://localhost:8080`).

## Tests

```bash
npm test              # unit and component tests (Vitest + React Testing Library)
npm run test:e2e      # end-to-end tests (Playwright, headless)
```

- **Unit and component tests** sit next to the code as `*.test.ts` / `*.test.tsx` (see `src/components/ApplicationRow.test.tsx`).
- **End-to-end tests** are in `e2e/`. Playwright starts the backend itself, on a fresh PostgreSQL in Docker (in-memory H2 when Docker is not running), and builds and starts the frontend on port 3000; it stops if 8080 or 3000 is already taken, so stop your own servers first, or move the frontend with `E2E_FRONTEND_PORT=3200 npm run test:e2e`. It runs each test at laptop and phone size. The first time, run `npx playwright install chromium`.

Add both kinds for your use case. Every pull request into `main` runs them.

## Where things are

| What | Where |
| --- | --- |
| Pages | `src/app/**/page.tsx` — one folder per URL |
| Shared layout (header, desk navigation, footer) | `src/app/layout.tsx` |
| Components | `src/components/` |
| Calls to the backend | `src/lib/api.ts` |
| Look: colors, corner radius, fonts | `src/app/globals.css` (one daisyUI theme, `careerbridge`) |
| `/styleguide` | The component catalogue: every block a screen may use, with the component or classes to copy |

## Design

The rules for how a screen looks are in one place, [ADR-0004](../../spec/adr/0004-frontend.md). In short: build from the blocks on `/styleguide` and the components in `src/components/`, theme colors only, check at phone, tablet and laptop width. `npm run lint` refuses hard-coded colors, inline styles and other component libraries; before opening the pull request, run the `screen-review` skill.

## Sample data

`src/lib/sampleDesk.ts` only fills `/styleguide`; `npm run lint` refuses it in any other file. A screen takes its data from the backend through `src/lib/api.ts`, and the types the screens share are in `src/lib/api.ts` and `src/lib/stages.ts`. Anything the backend cannot answer yet is marked `STAND-IN` (ADR-0004 point 7).

## Adding your screen

1. Find your stub page; it renders `<Placeholder />` with your use case and name.
2. Add the backend calls you need to `src/lib/api.ts`, with field names from the domain model.
3. Replace the placeholder with your screen.
