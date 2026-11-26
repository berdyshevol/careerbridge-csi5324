---
name: doc-changelog
description: Draft the Change Logs of the CareerBridge documentation (spec/change-log.md, sections Iteration I, Iteration II and Final Deliverable) from the merged pull requests, grouped by iteration and summarised into the main functional, non-functional and documentation changes. Use when asked to "write the change log", "fill in the Change Logs", "what changed this iteration", or before building the PDF for a deliverable while change-log.md still says "Not written yet". Not for release notes of one pull request, and not for the git history itself.
---

# Draft the Change Logs

`spec/change-log.md` holds the main changes of each iteration, not one line per commit (that is
git). You draft it from the merged pull requests, show it, and change nothing before a yes.

## 1. Iteration boundaries

An iteration ends on the day its deliverable is due: Iteration I with Deliverable 2, Iteration II
with Deliverable 4, the Final Deliverable with Deliverable 5. Read the dates from the project
librarian's notes next to this repository, if they are there:
`../group-project-notes/deliverables/deliverable-N/` (`assignment.md`, `status.md`,
`requirements.md`) and `../assignments/assignments.md`; Canvas dates win over the syllabus. Not
there or unclear: ask for the three dates. Say which dates you use and where they come from. A
pull request belongs to the first iteration whose end is on or after its `mergedAt` (US Central
time; 11:59 pm deadlines).

## 2. Collect

```bash
gh pr list --state merged --limit 300 --json number,title,mergedAt,body
```

Group the pull requests by iteration. If the Jira tools answer (the `atlassian` server), read the
epics (`UC-NN …`) and their status per iteration to check which use cases were built when; if
they ask for sign-in, go on without them and say so.

## 3. Summarise

For each iteration keep the existing heading and write three short lists, newest work last:

- **Functional changes:** use cases and features that now work, by use case (`UC-04 Apply for Job:
  …`); screens added for a role.
- **Non-functional changes:** security, data, performance, deployment, tests and CI, process.
- **Documentation changes:** sections of the documentation added or reworked, and what the
  instructor's feedback changed.

Merge many pull requests into one line; leave out typo fixes, merges and tooling a reader does not
need. Name a pull request only when it is the whole change. An iteration before the repository
existed (work in Word): say what the notes say it delivered, and mark what you could not confirm.
Keep the intro paragraph and the three `###` headings as they are; no `## N.` numbers, since the
Change Logs come before the table of contents.

## 4. Show and ask

Show the full draft and `diff -u spec/change-log.md <draft>`. Ask "Shall I put this in
spec/change-log.md?". Write nothing before a yes. On a yes, hand the change to the
`implement-task` skill (a documentation task with its own ticket and pull request).

## Do not

- Do not list every pull request or copy their titles verbatim.
- Do not invent changes the pull requests or notes do not show.
- Do not copy anything from the librarian's notes into this repository except the summary itself.
- Do not commit, push, submit or send anything from this skill.
