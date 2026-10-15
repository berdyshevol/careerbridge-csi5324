---
name: implement-task
description: Implement one CareerBridge task from start to pull request — update main, branch, write the change with its tests, offer simplify and code review, then open the pull request with the GitHub CLI. Use when asked to "implement SCRUM-NN", "do this ticket", "implement this task", or given a Jira link or a description of a change to make in this repository.
---

# Implement a task

You take one task from a Jira ticket or a description to an open pull request. The rules for the
code are in `CLAUDE.md`; this file is only the order of the steps. One task,
one branch, one pull request: everything below lands on the same branch before the pull request is
opened.

## Steps

1. **Understand the task.**
   - A Jira key or link: read the ticket with the Jira tools (the `atlassian` server in
     `.mcp.json`). If it is assigned to someone other than the person you are working for, say so
     and stop until they confirm.
   - A description without a ticket: restate it in one sentence; if it is too vague to test, ask.
     Then offer to create the ticket: a Story in the active sprint, assigned to the person, its
     parent the epic of its use case (`UC-NN <name>`; none for work outside a use case), summary
     `UC-NN · <Layer>: <what>` (`Process · <what>` outside a use case). Create it only on a yes; on a
   no, stop, since a pull request needs a ticket. Without a ticket the pull request check
     fails and the board never shows the work.
   - Read what the task points to in `spec/` before any code.
   - Find the FRs in `spec/requirements.md` that the task implements. If the ticket has no
     `Covers:` line, offer to add one to its description (`Covers: FR-UC04.1, FR-UC04.3`), so a
     search for an FR finds the tickets that built it.
2. **Start from a fresh `main`.** The working tree must be clean; if it is not, stop and ask.

   ```bash
   git checkout main
   git pull --ff-only
   git checkout -b <name>/<SCRUM-NN>-<short-slug>
   ```

   `<name>` is the person's prefix on their other branches (`git branch -a`). Keep the Jira key in
   capitals so Jira links the branch.
3. **Implement.** Only what the task asks for. Write the tests the rules require and run them
   until they pass.
4. **Check the screen.** If the change touches `app/frontend/src/app/` or
   `app/frontend/src/components/`, run the `screen-review` skill on the branch now, without asking,
   and fix its "must fix" findings on this branch. Its one-line verdict and where the screenshots
   are go into the pull request description under `## Screens`. Skip this step when nothing under
   `app/frontend/src/` changed.
5. **Ask: simplify?** "Run simplify on this change now?" Yes: run the `simplify` skill on the diff
   and apply its fixes. No: go on.
6. **Ask: code review?** "Run a code review now?" Yes: run the `code-review` skill on the diff, fix
   the findings that are real defects in this change, and list the others with the reason they
   were left. No: go on. Run the tests again after any fix from step 5 or 6.
7. **Ask: pull request?** "Open the pull request now?" No: stop here and report the branch name and
   what is left.
8. **Commit, push and open the pull request.** Title `SCRUM-NN <what changed>`; the `Ticket` check
   fails a title without the key. The push runs the tests (the pre-push hook); if it fails, fix the
   cause — do not use `--no-verify`.

   ```bash
   gh pr create --base main --title "SCRUM-NN <what changed>" --body "<description>"
   ```

   The description says what changed and why, anything the next ticket needs to know, the local
   test results, and any review finding left open. If simplify or the review was declined, say so
   there.

   The local test results are a `## Tests` section with one line per suite, taken from the push
   you just made and never from memory:

   - **JUnit:** the sum of `Tests run`, `Failures` and `Errors` in
     `app/backend/target/surefire-reports/*.txt` (the hook runs Maven quietly, so the push prints
     no numbers).
   - **Vitest** and **Playwright:** the totals the push printed.
   - A suite that did not run is written as "not run" with the reason: `SKIP_E2E`, `--no-verify`,
     or nothing under `app/` changed.
9. **Report** the pull request link, what was skipped, and what is left for a person to decide.

## The three questions

Steps 5, 6 and 7 are yes/no questions to the person, one at a time, each at its own step: use the
question tool (`AskUserQuestion`) when there is one, plain text otherwise. Do not decide for them
and do not ask all three at once: the answer to one depends on what the step before found. When
only documents changed, skip the questions of steps 5 and 6; there is no code to check.

## Do not

- Do not merge the pull request or change the ticket's status or assignee unless asked. The `Jira`
  workflow (`jira-sync.yml`) moves the ticket to In Review when the pull request opens and to Done
  when it merges.
- Do not open the pull request before the questions of steps 5 and 6 are answered; a fix found
  later goes on the same branch, not into a second pull request.
- Do not add Claude or AI attribution to commits or the pull request.
