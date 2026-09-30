# Deliverable 3 / Pre-Iteration 2 — working status

> Task: [assignment.md](assignment.md) · Due **Wed Oct 14, 2026 11:59pm** · 3 pts · one PDF.
>
> This file is the state of *this* deliverable. Update it as work lands.

Updated: 2026-09-29.

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
- Every member has at least one meaningful commit
- PDF: implementation status, roadblocks, website URL, annotated UI screenshots, updated docs
