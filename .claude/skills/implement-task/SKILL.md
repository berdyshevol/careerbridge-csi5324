---
name: implement-task
description: The one way to build anything in CareerBridge. Use whenever someone intends to implement, build, add, fix or change code in this repository — "implement SCRUM-NN", "do this ticket", "implement UC-05", "build the withdraw screen", "add an endpoint for…", "fix the apply button", a Jira link, a list of FRs, or a described change — even when they do not name this skill. It classifies the request as a small task, a vertical slice or a whole use case, makes sure a Jira ticket exists, and takes the work through plan, implementation, tests, simplify and review to a pull request.
---

# Implement a task

You take one request to an open pull request. The rules for the code are in `CLAUDE.md`; this file
is the order of the steps. One ticket, one branch, one pull request.

## 1. Check Jira

Make one cheap read with the Jira tools (the `atlassian` server in `.mcp.json`), such as reading
the given ticket or searching the project. If the tools are missing or ask for sign-in, stop: tell
the person to run `/mcp`, choose `atlassian` and sign in, then ask again. Do not go on without a
ticket: the pull request check fails without one and the board never shows the work.

## 2. Classify

| The request is | It is a | Go to |
| --- | --- | --- |
| `UC-NN`, a use-case epic (SCRUM-121 to 135), or several FRs of one use case | use case | [usecase.md](usecase.md) — slice it; no code, no pull request |
| a ticket whose summary starts `UC-NN ·` and builds a piece of a use case end to end | vertical slice | step 3, with [slice.md](slice.md) as its definition of done |
| anything else: a fix, a small change, one layer, documents, tooling | task | step 3 |

A described change that needs a new screen and backend work, or covers more than one FR, is a use
case or a slice, not a task. When it is unclear, ask one question: "Is this one small change, or a
piece of UC-NN?"

## 3. Ticket

- A Jira key: read the ticket. If it is assigned to someone else, say so and stop until the person
  confirms. If it says `Depends on:` a ticket that is not Done, say so and stop.
- No key: search the use case's epic and open tickets for this work. Found: ask "Is this
  SCRUM-NN?". Not found: offer to create it — a Story in the active sprint, its parent the epic
  (`UC-NN <name>`; none outside a use case), summary `UC-NN · <what>` (`Process · <what>` outside a
  use case), a `Covers: FR-…` line from `spec/requirements.md`, and a `Screen: <screen-id>, …` line
  when the work shows anything to a user (step 4). Create it only on a yes; on a no, stop.
- Assign the ticket to the person if nobody has it. Do not change its status: the `Jira` workflow
  moves it when the pull request opens and merges (ADR-0008).

## 4. Screens

Work that adds or changes anything a user sees is built to its screen's mockup (ADR-0011). Skip
this step only for backend-only or tooling work, and say so.

1. **Find the screens** in the catalog, the "Screens by role" tables of `spec/ui-drafts.md`: by
   the ticket's `Screen:` line, by screen ID, by address, or by use case (its "Use cases" column;
   one use case often has several screens, for several roles). A screen described in words: name
   the candidates and ask which one is meant.
2. **No screen in the catalog: stop.** Say: "There is no screen for <what> in the catalog. It
   needs an ID, a mockup `spec/screens/<id>.html` and a row in `spec/ui-drafts.md` first, agreed
   with the team." Do not invent a layout. Go on only if adding that screen is itself the request.
3. **Read each screen:** its catalog row (address, use cases, what it holds, where it leads), the
   mockup `spec/screens/<id>.html` (blocks, order, wording and navigation at each width), its
   picture `<id>.jpg`, and the current page and the components it imports. The current page is
   not a reference: where it differs from the mockup, it is rebuilt to match.
4. **Map the mockup to code:** for each block of the mockup, the `/styleguide` block or
   `src/components/` component that draws it. A block with none becomes a new component and a
   `/styleguide` entry in this pull request. The mockup's `cb.css` classes are never copied into
   the code.
5. **The role's header, navigation and phone dock** are shared by all its screens
   (`src/app/layout.tsx`). If they do not match the mockup yet, say so and ask whether to build them
   in this ticket or a separate `Process ·` one; never draw a copy inside one page.
6. **A change that differs from the mockup**, asked for by the person: change the mockup in the
   same pull request (edit `<id>.html`, then `cd app/frontend && npm run mockups -- <id>`), and the
   catalog row if the address, role, use cases or hand-offs change. A change to the navigation or
   to another role's screens needs the team's agreement first: ask.

## 5. Pipeline

Copy this checklist into your reply and tick it as you go. Do not skip a box; write why when one
does not apply.

```
- [ ] a. Fresh branch
- [ ] b. Plan
- [ ] c. Implement
- [ ] d. Tests green
- [ ] e. Simplify, then tests green
- [ ] f. Review, fix, tests green (round 1/3)
- [ ] g. Screens
- [ ] h. Pull request
```

**a. Fresh branch.** The working tree must be clean; if it is not, stop and ask.

```bash
git checkout main && git pull --ff-only
git checkout -b <name>/SCRUM-NN-<short-slug>
```

`<name>` is the person's prefix on their other branches (`git branch -a`); keep the key in capitals
so Jira links the branch. Resuming earlier work: check out its branch instead.

**b. Plan.** Files to change, tests to add, FRs covered, and for each screen the block-to-component
map of step 4. For a slice, show the plan and wait for an OK. For a task, write it in one line and
go on.

**c. Implement.** Only what the ticket asks for, with the tests `CLAUDE.md` requires.

**d. Tests green.** Before the first run, check the ports: if `lsof -i :3000 -i :8080` shows a
program that is not this branch's server, stop and say which, because the end-to-end tests would
test it instead. Run what the change touches:

- backend: `cd app/backend && ./mvnw -q -B test`
- frontend: `cd app/frontend && npm run lint && npm test`
- end to end: `cd app/frontend && npm run test:e2e`

If a test fails, see whether it also fails on `main`. A failure that is already on `main` is not
this ticket's: report it and go on. Read only the end of long test output.

**e. Simplify.** Start a subagent on the branch's diff (`git diff main...HEAD`) that looks only for
reuse of existing code, needless code, inefficiency and the wrong level of abstraction, and returns
a list without editing. Apply what makes the code shorter or clearer without changing behaviour,
then run the tests again.

**f. Review.** Start a fresh subagent on the diff and the ticket that reports only defects in
correctness or in what the ticket and `spec/` require — not style, not cases that cannot happen.
Fix each real defect, run the tests, and review again. At most three rounds; a round that changed
nothing, or a review that finds no defect, ends the loop. Findings you leave go into the pull request. If the last round changed more
than a few lines, run step e once more on those lines only.

**g. Screens.** If anything under `app/frontend/src/app/` or `app/frontend/src/components/`
changed, run the `screen-review` skill, which also compares the page with its mockup, and fix its
"must fix" findings. Otherwise tick it as not applicable.

**h. Pull request.** Commit, push and open it; the push runs the tests (the pre-push hook).

```bash
gh pr create --base main --title "SCRUM-NN <what changed>" --body "<description>"
```

The description says what changed and why, what the next ticket needs to know, review findings
left open, and:

- `## Tests` — one line per suite from the push you just made, never from memory: JUnit is the sum
  of `Tests run`, `Failures` and `Errors` in `app/backend/target/surefire-reports/*.txt`; Vitest
  and Playwright are the totals the push printed; a suite that did not run is "not run" with the
  reason.
- `## Screens` — each screen ID, whether the page matches its mockup or what was changed in the
  mockup and why, screen-review's verdict and where the screenshots are, when step g ran.

Then report the link and anything left for a person to decide.

## When it stays red

After three rounds, or when a failure cannot be fixed here: commit on the branch and do not push
past the hook. If only the end-to-end tests fail and they also fail on `main`, push with
`SKIP_E2E=1` and open the pull request as a draft (`gh pr create --draft`) with a `## Not done`
section. Otherwise stop, report what is red and the branch name, and leave the next step to the
person.

## Do not

- Do not use `--no-verify`, and do not merge the pull request.
- Do not change a ticket's status; assign it only as step 3 says.
- Do not open the pull request before steps d to g are done, except the draft in "When it stays
  red"; a later fix goes on the same branch.
- Do not add Claude or AI attribution to commits or the pull request.
- When only documents changed, skip steps d to f and say so in the pull request.
