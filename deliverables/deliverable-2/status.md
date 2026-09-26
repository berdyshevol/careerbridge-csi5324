# Deliverable 2 / Iteration 1 — working status

> Task: [assignment.md](assignment.md) · **Who writes what: [team-guide.md](team-guide.md)** ·
> Item-by-item progress: [checklist.md](checklist.md) ·
> Grading traps: [pitfalls.md](pitfalls.md)
>
> Due **Mon Sep 28, 2026 11:59pm** · 8 pts · two PDFs (documentation §1–§6 + slides) ·
> **presentation in class Tue Sep 29** (15 min + 5 Q&A, every member speaks) ·
> graded **individually** on each member's use cases.
>
> This file is the state of *this* deliverable. Update it as work lands; it stays in this folder
> when the team moves on to Deliverable 3.

Updated: 2026-09-25 (Canvas re-checked; new requirements from the Sep 22 announcement and lecture
slides are in [assignment.md](assignment.md#update-2026-09-25--dr-rens-announcement-and-lecture-slides)).

## Where we are

Use cases are drafted: Josh's doc (17 fully-dressed use cases + 2 subfunctions, use-case diagram,
business rules BR-1…BR-15, assumptions A1–A6) is the working document
[deliverable-2.md](deliverable-2.md) (team surface: [Word doc on OneDrive](https://baylor0-my.sharepoint.com/:w:/r/personal/josh_joseph3_baylor_edu/Documents/Microsoft%20Teams%20Chat%20Files/CSI%205324%20%E2%80%93%20Deliverable%202%20Use%20Cases.docx?d=wc0e6e8360799410caaeada9754bb7b60&csf=1&web=1&e=7HArpk)).
Each member now writes the full chain **FR + NFR → UC → SSD → operation contracts** for their own
use cases — see [team-guide.md](team-guide.md), posted to the team chat on Sep 25. Jira updated
the same day: 4 cards per member, all assigned (SCRUM-24…34, 46…55).

Missing: every member's FRs/NFRs, SSDs and contracts; §1–§2 vision; §3.3 clarifications; domain
model; wireframes; slides.

## Use case ownership (Josh's split, Sep 25)

| Member | Role | Use cases |
|---|---|---|
| Oleg Berdyshev | Project Librarian | UC-01 Browse Job Postings · UC-02 Register as Applicant · UC-03 Maintain Profile and Resume |
| Rabeya Nazara | Requirements Engineer | UC-04 Apply for Job · UC-05 Track Application Status · UC-06 Withdraw Application · UC-07 Respond to Job Offer |
| Reagan Rubio | QA Engineer | UC-08 Register Recruiter and Organization · UC-09 Join Additional Organization · UC-10 Approve Recruiter/Organization Request |
| Zeba Tusnia Towshi | Project Manager | UC-11 Create Job Posting · UC-12 Approve Job Posting · UC-13 Expire Job Posting |
| Josh Job Joseph | Design Engineer | UC-14 Screen Applications · UC-15 Record Interview · UC-16 Extend Job Offer · UC-17 Reject Application |

Still to settle: the assignment says "only 3 use cases per team member" — Rabeya and Josh have 4.
The doc settles D-005 as a single Administrator role (A1, A4).

## Open questions for the customer (Dr. Ren)

| # | Question | Why it matters | Status |
|---|---|---|---|
| 1 | Is the rubric's "Vision Document" (1 pt) the template's §1+§2, or a separate artifact? | A scored item with no section in the template | open |
| 2 | Are operation contracts required for Iteration 1? | SSDs are now confirmed (announcement: docs = template §1–§6, §6 = Sequence Diagrams); contracts have no template section but the grading intro names them | partly answered — SSDs yes; contracts open, default: include |
| 3 | Admin model: platform System Admin vs Company Admin (D-005) | Changes the actors on the use case diagram | open |

Give these Q-xxx IDs in [team/QUESTIONS.md](../../team/QUESTIONS.md) before the next call.

## Shared tasks

- [ ] §1–§2 Vision & scope (1 pt) — Zeba (SCRUM-18); include the JavaScript/Node.js rationale in §2.2 (D-004)
- [ ] AI feature scope, in or out — Rabeya (SCRUM-21)
- [x] Use case diagram with system boundary and system actors — Josh
- [ ] Domain model — nouns only (2 pts) — Reagan (SCRUM-29)
- [ ] Wireframes, legible at 100% zoom (0.5 pt) — Josh (SCRUM-38)
- [ ] §3.3 clarifications synced from [team/QUESTIONS.md](../../team/QUESTIONS.md) (1 pt) — **no owner** (its card, SCRUM-17, was deleted on Sep 25)
- [ ] Document from template, PDF assembly, slide metrics — Oleg (SCRUM-39, 40, 42)
- [ ] Slides (slide 20 minimum), every member speaks — Zeba (SCRUM-41)
- [ ] Jira board current at the deadline (0.5 pt) — everyone moves their own cards and logs time

## Iteration 1 hard rules (from the pitfalls page)

Analysis before implementation · use cases describe system behaviour, never UI clicks · explicit
system boundary including system actors · domain model has no methods, UI or persistence · **no
placeholders or "TBD" in the submitted PDF** · traceability Requirements → Use Cases → SSDs →
Operation Contracts, with consistent naming and IDs.

## Submission chain

doc-sync → memory-lint → export both PDFs → upload to Canvas (PDF only, unlimited attempts).
