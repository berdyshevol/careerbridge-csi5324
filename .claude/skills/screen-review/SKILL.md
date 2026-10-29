---
name: screen-review
description: Check a CareerBridge screen against its mockup in spec/screens and ADR-0004 (shared layout, blocks from /styleguide, theme colors only, one btn-primary, tests) and take screenshots at 390, 820 and 1440 px, then report what to fix. Use whenever a change adds or edits files under app/frontend/src/app/ or app/frontend/src/components/ — after implementing a page, before committing or pushing a frontend change, before `gh pr create` for a branch that touches a page, at the end of implement-task for a frontend ticket — and when asked to "review the screen", "check the page/design", "check PR N against the design", "does this look right", or "screenshot the page".
---

# Screen review

You check that a new or changed screen follows `spec/adr/0004-frontend.md`. Read that file first:
it is the only statement of the rules, and the table below is just the order to check them in. The
allowed blocks are on `/styleguide` (`app/frontend/src/app/styleguide/page.tsx`). You report; you
do not edit unless asked.

## Steps

1. **Find the change.** For a PR number: `gh pr diff <n> --name-only` and `gh pr diff <n>`; for a
   branch: `git diff main...<branch>`. Keep only files under `app/frontend/src/`; a changed component
   in `src/components/` counts as a change to every page that imports it
   (`grep -rl <Component> app/frontend/src/app`). If none, say so and stop. For each changed page,
   find its screen ID by its address in the catalog ("Screens by role" in `spec/ui-drafts.md`); a
   page that is not in the catalog is a "must fix" (ADR-0011).
2. **Read the screen files in full**, not just the diff, plus the components they import.
3. **Check each rule.** For every finding give the file, the line and the fix.

   | Rule | What to look for |
   | --- | --- |
   | Matches its mockup | The blocks, their order, the wording, the main action and the role's navigation are those of `spec/screens/<id>.html`. A deliberate difference is drawn in the mockup in the same change (`<id>.html` and `<id>.jpg`); otherwise it is a finding. |
   | Shared layout | The page renders inside `src/app/layout.tsx` (no own header, nav or footer; no `<html>`/`<body>`). |
   | Blocks from the catalogue | Title via `PageTitle`; content in `card border border-base-300 bg-base-100`; side panels `rounded-2xl border border-base-300 bg-base-100 p-5`; messages as `alert`; stage chips via `StageBadge`; slots via `SlotMeter`; postings via `PostingCard`; nothing drawn by hand that a component already draws. |
   | One main action | At most one `btn-primary` visible at a time; the way back is a plain `btn`; links are `link link-primary`. |
   | Theme only | No `[#…]` colors, no `style=` attributes, no other UI library, no own fonts. `npm run lint` in `app/frontend` catches the first three; run it. |
   | Names from the specification | Fields and operations named as in `spec/domain-model.md` and `spec/ssd-and-contracts.md`. |
   | Copy | Plain sentences; a message says what went wrong and the way out; no "TBD". |
   | Tests | A Vitest file for the component and a Playwright test for the main flow (`app/frontend/e2e/`). |
   | Sample data marked | Anything not from the backend comes from `src/lib/sampleDesk.ts` or a file marked `STAND-IN`, and the screen says so. |

4. **Look at it.** Run your own copies on free ports, so another app on 3000 or 8080 is never
   what you photograph (the backend allows the port through `FRONTEND_ORIGINS`):

   ```bash
   cd app/backend && PORT=8180 FRONTEND_ORIGINS=http://localhost:3100 ./mvnw -q spring-boot:run
   cd app/frontend && NEXT_PUBLIC_API_URL=http://localhost:8180 npx next dev -p 3100
   ```

   If `lsof -i :3100 -i :8180` shows something already listening, pick other ports for both. Wait
   until `curl -sf http://localhost:8180/api/postings` and `curl -sf http://localhost:3100` answer,
   then take screenshots of each changed page at 390, 820 and 1440 px with Playwright
   (`chromium.launch()` from `@playwright/test`, run from `app/frontend` so the package resolves).
   Save them outside the repository. Compare each width with the same width in the mockup's
   picture `spec/screens/<id>.jpg`: same blocks in the same places, same ground, cards, type sizes
   and spacing. Sample names and numbers may differ. Note anything that overflows, overlaps or is
   cut off at phone width. Stop both servers when done.
5. **Report** in this order: must fix (breaks a rule), should fix (looks different), fine. End with
   one line: ready to merge, or not, and why. Attach the screenshots or say where they are.

## Do not

- Do not rewrite the screen to your taste; the rules above are the whole checklist.
- Do not approve on the diff alone; the screenshots are part of the review.
- Do not skip `npm run lint` and `npm test`; quote failures verbatim.
- Do not commit the page screenshots or the screenshot script. Only the mockup pictures in
  `spec/screens/` are committed, drawn by `npm run mockups`.
