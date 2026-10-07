# CareerBridge — frontend

Next.js (TypeScript) with Tailwind and daisyUI. It needs the backend running; see [../README.md](../README.md).

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. `npm run lint` checks the code; `npm run build` makes a production build. To point at another backend, set `NEXT_PUBLIC_API_URL` (default `http://localhost:8080`).

## Where things are

| What | Where |
| --- | --- |
| Pages | `src/app/**/page.tsx` — one folder per URL |
| Shared layout (header, desk navigation, footer) | `src/app/layout.tsx` |
| Components | `src/components/` |
| Calls to the backend | `src/lib/api.ts` |
| Look: colors, corner radius, fonts | `src/app/globals.css` (one daisyUI theme, `careerbridge`) |

## Design

The look comes from the team's design canvas. Use daisyUI components (`btn`, `card`, `badge`, `input`, `alert`) so everything picks up the theme; do not hard-code colors.

The desk navigation has three forms, in `src/components/DeskNav.tsx`: a side column on laptops, a row of tiles on tablets, a bottom bar on phones. Check your page at all three widths.

## Sample data

The desk page shows applications, an offer and a resume from `src/lib/sampleDesk.ts`, because the backend cannot answer those yet. Replace each piece with a call in `src/lib/api.ts` when its use case is implemented (UC-05, UC-07, UC-03).

## Adding your screen

1. Find your stub page; it renders `<Placeholder />` with your use case and name.
2. Add the backend calls you need to `src/lib/api.ts`, with field names from the domain model.
3. Replace the placeholder with your screen.
