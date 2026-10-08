# Project Deliverable 2 – Iteration 1

> Source: [Canvas – "Project Deliverable - Iteration 1"](https://baylor.instructure.com/courses/257917/assignments/2911216) (CSI 5324, Fall 2026)
>
> **Due: Mon Sep 28, 2026, 11:59pm** · **8 points** · Unlimited attempts · Submission: **PDF only**
>
> Re-read from Canvas **2026-09-22**; re-checked **2026-09-25** — see
> [Update 2026-09-25](#update-2026-09-25--dr-rens-announcement-and-lecture-slides). The rubric and several details below were not in the earlier
> copy of this file — see [What changed on 2026-09-22](#what-changed-on-2026-09-22).
>
> Naming: Canvas "Project Deliverable 2" **is** the course's **Iteration 1** (requirements & analysis).

Group submission — one copy per team. **The grade is individual**, based on each member's completion
of their use cases and operation contracts.

> **Read first:** [Iteration 1 — Common Documentation Pitfalls](pitfalls.md) — Dr. Ren's grading
> guidance. That page is where the points are actually lost.

Canvas framing: *"Keep working on the Project and make sure to plan ahead for the upcoming
Iteration 2."*

## Grading rubric (8 points — from the Canvas rubric)

| Criterion | Points | Where it comes from |
|---|---|---|
| Requirements Clarification | 1 | template §3.3 + [team/QUESTIONS.md](../../team/QUESTIONS.md) |
| Use Case Diagram | 1 | template §4.1 |
| **Vision Document** | **1** | **rubric only — not in the assignment text** (see open questions) |
| Use Cases – Full-dressed | 2 | template §4.2, 3 per member |
| Wireframes | 0.5 | UI initial drafts |
| Domain Model | 2 | template §5 |
| Scrum Dashboard Update | 0.5 | Jira/Trello board must be current at the deadline |

Two observations worth acting on: the **Domain Model and the fully-dressed use cases carry 4 of the
8 points**, and **Vision Document (1 pt) appears nowhere in the assignment text** — only in the
rubric.

## What the documentation PDF must contain

Canvas: *"Submit the following in a single PDF with any necessary updates."*

1. (If there were any updates) Updated **requirements clarification questions** — and the answers,
   if already given.
2. **Use-case diagram**, clearly illustrating the **system boundary** and **actors (including
   system actors)**.
3. **All use cases in fully-dressed form** — *only 3 use cases per team member*.
4. **Domain model.**
5. **UI initial drafts** — wireframes or any other tool. Hand-drawn is acceptable, but the figure
   must be **clear** in both the submission and the presentation.

Use the **given document template** → [`course/templates/`](../../course/templates/README.md).

## Presentation slides — separate PDF, **15 minutes**, shared with the class

- **Project Analysis:** what main features the team will implement; what the team's **assumptions**
  about the system are.
- **Requirements** (functional + non-functional) **+ use cases** — *each member presents one use
  case he/she is responsible for*.
- **UI sketches** (hand drawing is fine).
- **Domain models:** main domain concepts + the domain model diagram.
- **All issues in the ticketing system** (open and resolved), the **number of commits**, and the
  **roster of hours worked by each member** (rough estimate is acceptable), including Trello/Jira
  history.

## What to submit

1. A single **PDF of the documentation**, using the given document template.
2. A **PDF of the presentation slides** — this one is shared with the whole class.

Canvas accepts **PDF only**, unlimited attempts.

## What changed on 2026-09-22

Differences between the live Canvas page and the earlier version of this file:

- **Slides are 15 min, not 10.** Plan the run-through accordingly: 5 members × one use case each
  plus analysis, UI and domain model.
- **The rubric is now visible** (table above). It adds two scored items nobody had on the list:
  **Vision Document (1 pt)** and **Scrum Dashboard Update (0.5 pt)**.
- **SSDs and operation contracts are no longer in the itemized documentation list.** They were
  item 5 in the earlier copy of this file. The intro still says the individual grade is based on
  "completion on use cases **and operation contracts**", and the template has a Sequence Diagrams
  section (§6) — but no rubric line scores them.
- **The document template exists now:** `CSI5324_Project_Documentation_Template.docx`, plus a
  `Sample Documentation.pdf`, both under [`course/templates/`](../../course/templates/README.md).

## Update 2026-09-25 — Dr. Ren's announcement and lecture slides

Re-checked Canvas on 2026-09-25. The assignment page itself is unchanged since 2026-09-22 (rubric
included). Two new sources add requirements that are **not** on the assignment page:

**Canvas announcement "Pre-DS 4 Assignment and Project Iteration I Presentation" (Sep 22):**

- Each team has **15 min presentation + 5 min Q&A**.
- The documentation must be submitted **by Monday** so he can check that the scope and assumptions
  align with the analysis and design.
- **Documentation: only the first 6 template sections (everything before the DCD).** Other
  sections can be removed from the Iteration 1 submission. → §1–§6, so **§6 Sequence Diagrams
  (SSDs) are in scope**; §7 DCD and later (incl. §10 Team Contribution) can be dropped.

**Lecture slides `5_ArchitectureDesign_1.pdf`, slide 20 "Project Iteration 1 – Presentation":**

- **Every member is required to speak.**
- Minimal requirements:
  - Project and team information
  - Project assumption
  - Functional: main features that will be delivered in the final — **at least 5 features**
  - Non-functional requirements
  - Use cases: each member presents **ONE** use case they are responsible for
  - Domain model diagram
  - UI sketches
  - **Scrum dashboard (screenshot or live)** + member contribution (rough hours)
- Make sure all figures/tables are readable.

**Slide 21 "This Week's To-Do List":** Team Project — expected to be done: **SD + documentation**;
**Iteration I presentation: Tue 09/29** (the day after the documentation deadline).

**Pitfalls page** was edited on Sep 15 (after our Sep 9 copy): the standalone pitfall "SSDs that
are too detailed (or too empty)" was removed; the traceability pitfall still requires
Requirements → Use Cases → SSDs → Operation Contracts. See [pitfalls.md](pitfalls.md).

## Open questions for Dr. Ren

Both are worth asking early — they change how much work Iteration 1 is:

- **Q — Vision Document:** the rubric scores a "Vision Document" (1 pt) that the assignment text
  never mentions and the template has no section for. Is it template §1 Introduction + §2 Project
  Overview, or a separate artifact?
- **Q — SSDs / operation contracts:** ~~are SSDs required?~~ **Partly answered 2026-09-22** by the
  announcement (docs = §1–§6, so §6 Sequence Diagrams are in) and slide 21 ("SD + documentation").
  Still open: are **operation contracts** required? The template has no section for them, but the
  intro says the individual grade is based on "use cases and operation contracts". Safe default:
  include them next to each SSD in §6.

Add these to [team/QUESTIONS.md](../../team/QUESTIONS.md) with `Q-xxx` IDs before the next call.

## Related documents

- [Iteration 1 — Common Documentation Pitfalls](pitfalls.md) — the instructor's grading guidance
- [Documentation template & sample](../../course/templates/README.md)
- [Project AI Usage Policy](../../course/project-ai-usage-policy.md)
- [Group Project – Overview](../../course/group-project-overview.md)
- [Group Project – Problem Statement](../../course/group-project-problem-statement.md)
- [team/QUESTIONS.md](../../team/QUESTIONS.md) — the clarification questions to update
- [backlog-draft.md](backlog-draft.md) · [jira-import.csv](jira-import.csv)
