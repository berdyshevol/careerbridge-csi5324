# Deliverable 3 / Pre-Iteration 2 — working status

> Task: [assignment.md](assignment.md) · Due **Wed Oct 14, 2026 11:59pm** · 3 pts · two documents (status PDF + updated documentation).
>
> This file is the state of *this* deliverable. Update it as work lands.

Updated: 2026-10-07 (task re-synced from Canvas; the instructor changed it).

## Changed by the instructor (seen Oct 7)

- **Two documents, not one PDF.** The status summary is its own PDF and must not use the documentation template.
- **Updated documentation is now concrete:** fix the earlier sections from the Iteration 1 comments, and add at least **SDs and the DCD**. This is new work, not in the earlier plan.
- **Commits must be code** — a docs-only commit does not count for a member.

Open points:

- Iteration 1 comments are not visible yet (Deliverable 2 is ungraded; Canvas hides comments until grades are posted). Check again before revising the documentation.
- Canvas accepts PDF only and the task asks for two documents — ask Dr. Ren whether to upload two PDFs in one attempt.

## Where we are

Not started. First step: the team agrees on the stack and the work split.

## Open vote (sent by Oleg Sep 29, answers due Thu Oct 1)

1. **Backend stack**
   - **A — Java Spring MVC** (course default). No good free hosting; the project would live on GitHub only.
   - **B — Node.js with Spring-style layers** (model → repository → service → controller). Already
     approved by Dr. Ren. Free deploy on Vercel; Vercel team collaboration is paid, so we develop in
     one shared repo and each member mirrors it to their own account and deploys their own copy.
2. **Work split**
   - **Vertical slices** — each member builds one feature end to end (DB → UI); one person may build
     a frontend shell with stub pages that the slices plug into.
   - **By layer** — frontend / backend / data.

Oleg's vote: **B + vertical slices**; he offers to set up the project skeleton.
When the answers come in, record the outcome as a D-xxx in [DECISIONS.md](../../team/DECISIONS.md).

## Minimum scope (from the assignment)

- Data model + sample jobs file (CSV/XML)
- ApplyJob use case + its UI (backend wiring optional now, required in Iteration 2)
- Project website: group name, roles + use cases, Jira URL, repo URL
- Every member has at least one meaningful **code** commit
- Document 1 — status PDF (no template): implementation status, roadblocks, website URL, annotated UI screenshots
- Document 2 — updated project documentation: Iteration 1 comments addressed + SDs + DCD
