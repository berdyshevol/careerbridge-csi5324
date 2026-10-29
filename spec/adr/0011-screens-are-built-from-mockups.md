# ADR-0011: Every screen is built from its mockup in spec/screens

- **Status:** Accepted
- **Date:** 2026-10-29
- **Extends:** [ADR-0004](0004-frontend.md) (design first, one look on every screen)

## Context

ADR-0004 asks for every screen to be drawn at three widths before it is coded, and names the first
screens built (`/`, `/jobs`, `/jobs/[id]`, `/jobs/[id]/apply`) as the reference for the rest. In
practice each use case's owner drew their own screen, or none: every role saw every navigation
entry, recruiters saw the job search, and pages looked alike only where they copied one another.
Five people build fifteen use cases, mostly with Claude Code, so the reference has to be something
a person and Claude can both open from the repository.

## Decision

1. **Every screen has an ID and a mockup.** The catalog of screens by role, with addresses, use
   cases and hand-offs, is in [ui-drafts.md](../ui-drafts.md) ("Screens by role"). Each screen's
   mockup is `spec/screens/<id>.html`, at phone, tablet and laptop width, with a picture beside it
   ([spec/screens/README.md](../screens/README.md)).
2. **A page is built to match its mockup**: the same blocks, order, wording, main action and
   navigation, drawn with the theme and the `/styleguide` blocks of ADR-0004. The mockups replace
   the reference screens named in ADR-0004's consequences.
3. **No mockup, no page.** Work on a screen that is not in the catalog stops until the screen is
   added: an ID, a mockup and a catalog row, agreed with the team.
4. **The mockup changes with the page.** A pull request that changes a screen on purpose changes
   its mockup and redraws its picture (`npm run mockups -- <id>`) in the same pull request.
5. **Claude follows the same path.** The `implement-task` skill finds the screens of the use case
   or address it is given in the catalog and reads their mockups before planning; `screen-review`
   compares the page's screenshots with the mockup.

## Consequences

- Any member can take a use case and build its screens without asking how they should look.
- The existing pages that do not match their mockups are rebuilt by their use case's owner, as part
  of that use case.
- Mockups are HTML and pictures in git: about 7 MB, and reviewed like any other change.
- A mockup that falls behind its page is a defect, caught by `screen-review`.
