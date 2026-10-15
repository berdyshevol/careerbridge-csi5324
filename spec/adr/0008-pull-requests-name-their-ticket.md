# ADR-0008: A pull request names its ticket; Jira follows it; Claude reviews it

- **Status:** Accepted
- **Date:** 2026-10-15
- **Extends:** [ADR-0003](0003-pull-requests-and-manual-deploy.md)

## Context

For Deliverable 3 the code moved ahead of Jira: work was done without tickets, statuses were not
moved by hand, and the board had to be rebuilt from the git history after the deadline. The tests
also do not catch a change that drifts from its ticket, the specification, an ADR or the screen
rules.

## Decision

- **Every pull request names its ticket.** Its title starts with `SCRUM-NN`; the branch is
  `<name>/SCRUM-NN-<slug>`. The required **Ticket** check fails a title without a key. No ticket,
  no pull request.
- **Jira follows the pull request.** The **Jira** workflow moves the ticket to In Review when the
  pull request opens (or its title is fixed) and to Done when it merges. Nobody moves statuses by
  hand. A workflow does it rather than a Jira automation rule, whose runs the free plan limits.
- **Tickets that build a use case** sit under its epic, `UC-01` to `UC-15`, so the board shows
  progress per use case; a `Covers: FR-…` line names the requirements a ticket builds.
- **Claude reviews every pull request,** advisory only: one comment on bugs, the ticket, the
  specification and ADRs, and the screen rules, read from the code. It never blocks a merge,
  because a model can be wrong. It does not replace the `screen-review` skill, which runs the
  screen and takes the screenshots.

## Consequences

- The board matches `main` without anyone tending it, and a use case's progress is one look.
- The Jira and Claude tokens are repository secrets, which the workflow copy on any collaborator's
  branch can read. Accepted while the collaborators are the five team members; the deploy secrets
  stay in environments that only `main` can use.
- Status changes appear in Jira under the account of `JIRA_EMAIL`, not the pull request's author.
- The review runs on Oleg's Claude subscription and counts toward its limits, so it runs when a
  pull request opens, not on every push.
