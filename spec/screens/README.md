# Screen mockups

> Part of the CareerBridge specification — see the [index](../README.md). The catalog of screens
> (which role reaches which address, for which use case) is the "Screens by role" part of
> [ui-drafts.md](../ui-drafts.md); this folder holds what each of those screens looks like.

One mockup per screen, named by its **screen ID**: `<role>-<screen>.html`, with its picture
`<role>-<screen>.jpg` beside it. Each mockup shows the screen at the three widths of
[ADR-0004](../adr/0004-frontend.md) side by side: phone 390 px, tablet 820 px, laptop 1440 px. All
of them share `cb.css`, the `careerbridge` theme redrawn for mockups. Open a mockup in a browser to
see it; read its HTML for the exact blocks and wording.

[ADR-0011](../adr/0011-screens-are-built-from-mockups.md) says how the mockups are used.

## The screen ID

The ID names a screen everywhere: the file names here, the catalog in
[ui-drafts.md](../ui-drafts.md), a ticket's `Screen:` line and a pull request's `## Screens`. The
page that draws a screen is the Next.js page of its address: `/applications/{id}` is
`app/frontend/src/app/applications/[id]/page.tsx`. Where two roles share an address (`/`, `/jobs`,
`/jobs/{id}`), one page draws both screens and chooses by the role of the logged-in user.

## What a mockup fixes and what it does not

- **Fixes:** which blocks the screen has, their order and place at each width, the wording, the
  main action, the navigation of the role.
- **Does not fix:** the code. Pages are built from the theme and the blocks on `/styleguide`, not
  from `cb.css`. A block in the mockup that `/styleguide` lacks becomes a component in
  `src/components/` and an entry on `/styleguide` first.
- **Shows every state.** A mockup draws the main state with one example, such as an application
  at Offer, and each extension's message or dialog as a separate block marked "When …", worded as
  in the use case.
- **Names and dates are examples.** Real data comes from the backend.
- **Exactly the specification.** Every block of a mockup traces to a use case step or extension,
  an FR, a business rule or an assumption, and every state they name is drawn. Something more is
  added to the specification first.

## Changing a screen

A screen changes in the pull request that changes its page:

1. Edit `<id>.html` (and `cb.css` only for a block that is new to every screen).
2. Redraw its picture: `cd app/frontend && npm run mockups -- <id>` (no ID redraws all).
3. If the address, role, use cases or hand-offs change, change the catalog in
   [ui-drafts.md](../ui-drafts.md) too.

A new screen gets a new ID, a mockup and a row in the catalog before its page is coded. A change
that touches other roles' screens or the navigation is agreed with the team first.

The mockups were first drawn on a Claude Design canvas on 29 October 2026; that canvas is no longer
kept up to date. These files are the reference.
