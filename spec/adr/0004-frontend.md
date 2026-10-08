# ADR-0004: Frontend — one application for phone, tablet and laptop, built with Tailwind and daisyUI

- **Status:** Accepted
- **Date:** 2026-10-07
- **Extends:** [ADR-0001](0001-spring-boot-and-nextjs.md) (Next.js as the frontend)

## Context

The system is used from three kinds of device: applicants browse and apply from phones, recruiters
and administrators work from laptops, and tablets sit in between. The team has one frontend
developer's worth of time, five members who mostly do not know JavaScript, and a design that
existed only as hand-drawn wireframes in the Iteration 1 documentation (section 4.4). The
wireframes show what each screen contains; they do not fix a look.

The options considered for the look were plain CSS, Tailwind alone, Tailwind with shadcn/ui, and
Tailwind with daisyUI.

## Decision

1. **One responsive application, not three.** Every screen is designed and checked at three
   widths: phone (390 px), tablet (820 px) and laptop (1440 px). The layout adapts; the content
   and the use case behind it are the same. The desk navigation, for example, is a side column on
   laptops, a row of tiles on tablets and a bottom bar on phones.
2. **Design first, on a canvas.** A screen is drawn for the three widths before it is coded (the
   applicant desk was the first). The Iteration 1 wireframes are the starting idea for what a
   screen holds, not its layout.
3. **Tailwind with daisyUI.** Tailwind gives the responsive layout; daisyUI gives ready
   components (`btn`, `card`, `input`, `alert`, `checkbox`, `dock`) that all take their colors and
   corner radius from **one theme**, `careerbridge`, defined in `app/frontend/src/app/globals.css`.
   Pages never hard-code colors. daisyUI was preferred over shadcn/ui because it is classes only:
   no component code to copy into the repository and maintain, and a member who knows HTML can use
   it.
4. **Two typefaces** loaded through `next/font`: Figtree for text, Bricolage Grotesque for
   headings (`font-display`).
5. **Thin frontend.** Pages are Next.js server components that read from the backend in
   `src/lib/api.ts` and render; interaction that needs state (forms) is a client component. Business
   rules live in the backend. Where a rule must run before the backend exists, it is written as a
   plainly marked stand-in in `src/lib/` with the same signature the backend call will have.
6. **One look on every screen.** Fifteen use cases by five people must read as one site. So:
   every page sits in the shared layout (`src/app/layout.tsx`: header, desk navigation, footer)
   and uses the same building blocks — a page title in `font-display`, content in `card`s with a
   `base-300` border, side panels as `rounded-2xl` boxes, messages as `alert`s, one `btn-primary`
   per screen for the main action and a plain `btn` for the way back, links as `link link-primary`.
   A screen never brings its own colors, fonts, spacing scale or component library. When a block is
   needed twice (a posting card, an application row, the slot meter), it becomes a component in
   `src/components/` and both screens use it.
   `/styleguide` is the live catalogue of these blocks and the reference for pull request review;
   a block that appears there is the only way to draw that thing. `npm run lint` refuses
   hard-coded colors, inline styles and other component libraries; the `screen-review` skill in
   `.claude/skills/` walks a reviewer through the rest.
7. **Sample data is explicit.** What the backend cannot answer yet (the logged-in applicant, their
   applications, resume and offer) comes from `src/lib/sampleDesk.ts`, and each screen that uses it
   says so. A use case replaces its piece of sample data with an API call when it is implemented.

## Consequences

- One codebase and one set of tests cover all devices; the Playwright tests run at laptop and
  phone size.
- A new screen is mostly layout and daisyUI classes; the theme does the styling.
- Changing the look is a change to `globals.css`, not to pages.
- Members must check their screen at three widths before opening a pull request.
- A pull request that adds a screen is checked for the look as well as the behavior: same
  layout, same components, nothing hard-coded. The existing screens (`/`, `/jobs`, `/jobs/[id]`,
  `/jobs/[id]/apply`) are the reference.
- Stand-ins and sample data must be removed as the backend grows; each is marked in the code so
  they can be found (`STAND-IN`, `SAMPLE DATA`).
