---
name: implement-task
description: Implement one CareerBridge task from start to pull request — update main, branch, write the change with its tests, run simplify and code review, then open the pull request with the GitHub CLI. Use when asked to "implement SCRUM-NN", "do this ticket", "implement this task", or given a Jira link or a description of a change to make in this repository.
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
4. **Simplify.** If the diff has code, run the `simplify` skill on it and apply its fixes. Skip it
   when only documents changed or the person said to skip it.
5. **Review.** Under the same condition, run the `code-review` skill on the diff. Fix the findings
   that are real defects in this change; for the others, list them with the reason they were left.
   Run the tests again after any fix.
6. **Commit and push.** Title `SCRUM-NN <what changed>`. The push runs the tests (the pre-push
   hook); if it fails, fix the cause — do not use `--no-verify`.
7. **Open the pull request.**

   ```bash
   gh pr create --base main --title "SCRUM-NN <what changed>" --body "<description>"
   ```

   The description says what changed and why, anything the next ticket needs to know, which tests
   ran, and any review finding left open. If step 4 or 5 was skipped, say so there.
8. **Report** the pull request link, what was skipped, and what is left for a person to decide.

## Do not

- Do not merge the pull request or change the ticket's status or assignee unless asked.
- Do not open the pull request before steps 4 and 5; a fix found later goes on the same branch,
  not into a second pull request.
- Do not add Claude or AI attribution to commits or the pull request.
