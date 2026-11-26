# ADR-0012: Each role has its own primary colors

- **Status:** Accepted
- **Date:** 2026-11-25
- **Amends:** [ADR-0004](0004-frontend.md) (one theme)

## Context

ADR-0004 gives the whole site one theme, `careerbridge`. Users who switch between accounts in a demo,
and the team testing with several roles, could not tell at a glance which role they were logged in
as. The team agreed at its November 25 meeting to give each role its own colors.

## Decision

1. **Three variants of one theme.** `careerbridge` (applicants and visitors, teal),
   `careerbridge-recruiter` (blue) and `careerbridge-administrator` (plum), all in
   `app/frontend/src/app/globals.css`. They differ in the primary and secondary colors and in a light tint of the page background
   (`base-200`) and borders (`base-300`); cards stay white and the accent color is shared. Fonts,
   spacing, corners, and the success, warning, error and info colors are the same for everyone, so a
   message means the same thing in every role.
4. **The header carries the role's color** (SCRUM-229): a bar in the primary color with white text and a
   white avatar. With only buttons and links in the role's color, the three workspaces still looked almost
   the same; the header and the tinted page tell the role from any part of the screen.
2. **The shared layout picks the variant** from the logged-in user's role (`themeOf` in
   `src/lib/session.ts`). Pages do not choose a theme and do not change.
3. **The mockups follow.** `spec/screens/cb.css` has the same variants, and each recruiter and
   administrator mockup uses its role's colors. `/styleguide` shows the three.

## Consequences

- Header, page background, navigation highlight, primary buttons, links and secondary chips change color
  with the role.
- A new role needs one more theme block and one line in `ROLE_THEMES`.
- Everything else in ADR-0004 stays: pages use theme colors only, never a hex value.
