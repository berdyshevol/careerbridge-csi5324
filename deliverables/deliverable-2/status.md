# Deliverable 2 / Iteration 1 — working status

> Task: [assignment.md](assignment.md) · Item-by-item progress: [checklist.md](checklist.md) ·
> Grading traps: [pitfalls.md](pitfalls.md)
>
> Due **Mon Sep 28, 2026 11:59pm** · 8 pts · two PDFs (documentation + 15-min slides) ·
> graded **individually** on each member's use cases.
>
> This file is the state of *this* deliverable. Update it as work lands; it stays in this folder
> when the team moves on to Deliverable 3.

Updated: 2026-09-22.

## Where we are

Requirements and analysis have not started. What exists: the assignment and rubric on file, the
course template downloaded, a backlog draft and a Jira import CSV. What is missing is everything
that gets graded.

## Use case ownership — **not yet assigned, this is the blocker**

Each member owns **3** fully-dressed use cases (15 total) and presents one of them personally.
Until this table is filled, nobody can start writing.

| Member | Role | UC 1 | UC 2 | UC 3 |
|---|---|---|---|---|
| Zeba Tusnia Towshi | Project Manager | | | |
| Rabeya Nazara | Requirements Engineer (leads Iteration 1) | | | |
| Josh Job Joseph | Design Engineer | | | |
| Reagan Rubio | QA Engineer | | | |
| Oleg Berdyshev | Project Librarian | | | |

Candidates to draw from: [backlog-draft.md](backlog-draft.md).

## Open questions for the customer (Dr. Ren)

| # | Question | Why it matters | Status |
|---|---|---|---|
| 1 | Is the rubric's "Vision Document" (1 pt) the template's §1+§2, or a separate artifact? | A scored item with no section in the template | open |
| 2 | Are SSDs and operation contracts required for Iteration 1? | The itemized list omits them; the intro mentions operation contracts; the pitfalls page demands traceability to them | open |
| 3 | Admin model: platform System Admin vs Company Admin (D-005) | Changes the actors on the use case diagram | open |

Give these Q-xxx IDs in [team/QUESTIONS.md](../../team/QUESTIONS.md) before the next call.

## Owner-independent tasks

- [ ] Requirements §3.1 / §3.2 — every planned feature must appear in ≥1 use case
- [ ] Use case diagram with an explicit system boundary and system actors
- [ ] Domain model — nouns only (2 pts)
- [ ] Wireframes, legible at 100% zoom (0.5 pt)
- [ ] §3.3 clarifications synced from [team/QUESTIONS.md](../../team/QUESTIONS.md) (1 pt)
- [ ] §2.2 — document the JavaScript/Node.js rationale (D-004)
- [ ] Jira board current at the deadline (0.5 pt)
- [ ] Slides: 15 min, one use case per member, plus issues / commit count / hours roster

## Iteration 1 hard rules (from the pitfalls page)

Analysis before implementation · use cases describe system behaviour, never UI clicks · explicit
system boundary including system actors · domain model has no methods, UI or persistence · **no
placeholders or "TBD" in the submitted PDF** · traceability Requirements → Use Cases → SSDs →
Operation Contracts, with consistent naming and IDs.

## Submission chain

doc-sync → memory-lint → export both PDFs → upload to Canvas (PDF only, unlimited attempts).
