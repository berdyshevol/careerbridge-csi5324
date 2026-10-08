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

Stack decided: **Java Spring Boot + Next.js** (D-018, Oct 7), replacing Node.js. A first skeleton is
in `main`: Spring JSON API in `app/backend/` with the layers of DS 4 and sample postings
loaded from `jobs.csv`; Next.js frontend with Tailwind and daisyUI in `app/frontend/`. UC-01 Browse Job
Postings works end to end; the other use cases have stub pages. The applicant desk follows the design
canvas and shows sample data until UC-05, UC-07 and UC-03 exist.

Still open:

- **Work split:** each member owns their use cases end to end (TEAM.md); who takes the shared parts
  (data model, Log In) is not agreed yet.

## Minimum scope (from the assignment)

- Data model + sample jobs file (CSV/XML)
- ApplyJob use case + its UI (backend wiring optional now, required in Iteration 2)
- Project website: group name, roles + use cases, Jira URL, repo URL
- Every member has at least one meaningful **code** commit
- Document 1 — status PDF (no template): implementation status, roadblocks, website URL, annotated UI screenshots
- Document 2 — updated project documentation: Iteration 1 comments addressed + SDs + DCD
