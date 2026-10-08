---
name: screen-review
description: Review a frontend pull request or branch of CareerBridge for the one-look rules of ADR-0004 — shared layout, blocks from /styleguide, theme colors only, one main action, tests at three widths — and report what to fix. Use when asked to "review the screen", "check PR N against the design", or before merging a pull request that adds or changes a page under app/frontend/src/app/.
---

# Screen review

You check that a new or changed screen looks like the rest of CareerBridge. The rules are in
`spec/adr/0004-frontend.md` (Decision, rule 6) and the allowed blocks are on `/styleguide`
(`app/frontend/src/app/styleguide/page.tsx`). You report; you do not edit unless asked.

## Steps

1. **Find the change.** For a PR number: `gh pr diff <n> --name-only` and `gh pr diff <n>`; for a
   branch: `git diff main...<branch>`. Keep only files under `app/frontend/src/`. If none, say so
   and stop.
2. **Read the screen files in full**, not just the diff, plus the components they import.
3. **Check each rule.** For every finding give the file, the line and the fix.

   | Rule | What to look for |
   | --- | --- |
   | Shared layout | The page renders inside `src/app/layout.tsx` (no own header, nav or footer; no `<html>`/`<body>`). |
   | Blocks from the catalogue | Title via `PageTitle`; content in `card border border-base-300 bg-base-100`; side panels `rounded-2xl border border-base-300 bg-base-100 p-5`; messages as `alert`; stage chips via `StageBadge`; slots via `SlotMeter`; postings via `PostingCard`; nothing drawn by hand that a component already draws. |
   | One main action | At most one `btn-primary` visible at a time; the way back is a plain `btn`; links are `link link-primary`. |
   | Theme only | No `[#…]` colors, no `style=` attributes, no other UI library, no own fonts. `npm run lint` in `app/frontend` catches the first three; run it. |
   | Names from the specification | Fields and operations named as in `spec/domain-model.md` and `spec/ssd-and-contracts.md`. |
   | Copy | Plain sentences; a message says what went wrong and the way out; no "TBD". |
   | Tests | A Vitest file for the component and a Playwright test for the main flow (`app/frontend/e2e/`). |
   | Sample data marked | Anything not from the backend comes from `src/lib/sampleDesk.ts` or a file marked `STAND-IN`, and the screen says so. |

4. **Look at it.** Start the backend and frontend (`app/README.md`), then take screenshots of each
   changed page at 390, 820 and 1440 px with Playwright (`chromium.launch()` from
   `@playwright/test`, run the script from `app/frontend` so the package resolves). Compare with
   `/jobs/[id]` and `/jobs/[id]/apply`, the reference screens: same ground, same cards, same type
   sizes, same spacing. Note anything that overflows, overlaps or is cut off at phone width.
5. **Report** in this order: must fix (breaks a rule), should fix (looks different), fine. End with
   one line: ready to merge, or not, and why. Attach the screenshots or say where they are.

## Do not

- Do not rewrite the screen to your taste; the rules above are the whole checklist.
- Do not approve on the diff alone; the screenshots are part of the review.
- Do not skip `npm run lint` and `npm test`; quote failures verbatim.
