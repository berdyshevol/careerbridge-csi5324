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
   - A description: restate it in one sentence. If it is too vague to test, ask.
   - Read what the task points to in `spec/` before any code.
2. **Start from a fresh `main`.** The working tree must be clean; if it is not, stop and ask.

   ```bash
   git checkout main
   git pull --ff-only
   git checkout -b <name>/<SCRUM-NN>-<short-slug>
   ```

   `<name>` is the person's prefix on their other branches (`git branch -a`). Keep the Jira key in
   capitals so Jira links the branch; leave it out when there is no ticket.
3. **Implement.** Only what the task asks for. Write the tests the rules require and run them
   until they pass.
4. **Ask: simplify?** "Run simplify on this change now?" Yes: run the `simplify` skill on the diff
   and apply its fixes. No: go on.
5. **Ask: code review?** "Run a code review now?" Yes: run the `code-review` skill on the diff, fix
   the findings that are real defects in this change, and list the others with the reason they
   were left. No: go on. Run the tests again after any fix from step 4 or 5.
6. **Ask: pull request?** "Open the pull request now?" No: stop here and report the branch name and
   what is left.
7. **Commit, push and open the pull request.** Title `SCRUM-NN <what changed>`. The push runs the
   tests (the pre-push hook); if it fails, fix the cause — do not use `--no-verify`.

   ```bash
   gh pr create --base main --title "SCRUM-NN <what changed>" --body "<description>"
   ```

   The description says what changed and why, anything the next ticket needs to know, which tests
   ran, and any review finding left open. If simplify or the review was declined, say so there.
8. **Report** the pull request link, what was skipped, and what is left for a person to decide.

## The three questions

Steps 4, 5 and 6 are yes/no questions to the person, one at a time, each at its own step: use the
question tool (`AskUserQuestion`) when there is one, plain text otherwise. Do not decide for them
and do not ask all three at once: the answer to one depends on what the step before found. When
only documents changed, skip the questions of steps 4 and 5; there is no code to check.

## Do not

- Do not merge the pull request or change the ticket's status or assignee unless asked.
- Do not open the pull request before the questions of steps 4 and 5 are answered; a fix found
  later goes on the same branch, not into a second pull request.
- Do not add Claude or AI attribution to commits or the pull request.
