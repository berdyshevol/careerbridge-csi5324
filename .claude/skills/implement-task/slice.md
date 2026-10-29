# A slice is done when

- [ ] Every layer it needs is in this pull request: entity and repository if new, the service
      method named after the operation in `spec/ssd-and-contracts.md`, the controller, the call in
      `app/frontend/src/lib/api.ts`, and the page.
- [ ] JUnit for the service, Vitest for the page and `lib/api.ts`, and a Playwright test for the
      slice's flow, all against the real backend.
- [ ] Each FR, step and extension in its `Covers:` line is built and tested.
- [ ] Each page of its `Screen:` line matches its mockup in `spec/screens/`; a deliberate
      difference is drawn in the mockup in this pull request.
- [ ] screen-review has run and its "must fix" findings are fixed.
- [ ] No sample data or stand-in reaches the screen for what this slice builds. A stand-in is
      allowed only for something another use case owns (log in, for one), marked `STAND-IN` with
      the ticket that will replace it.

When a slice turns out bigger than about 2 hours, or another member owns one of its layers, split
it by layer **without stubs**: the backend pull request first, then the frontend pull request
against the real endpoint. Each part gets its own ticket under the same epic; the second says
`Depends on:` the first.
