# CareerBridge — project rules & durable facts

Semester project for CSI 5324 (Software Engineering, Baylor, Fall 2026): a web-based **Recruiting and Application Management System** — a multi-company job board (LinkedIn-like) where organizations post jobs and applicants apply across companies.

This file holds the project's **durable** facts, conventions and rules — things that stay true for
the semester. It must not grow with day-to-day progress.

- **Where we are right now → [STATUS.md](STATUS.md)** (active deliverable, next actions, blockers).
- Per-deliverable state → `deliverables/deliverable-N/status.md`.
- History and rationale → [team/DECISIONS.md](team/DECISIONS.md).

**Rule of thumb:** if a fact will be false in two weeks, it does not belong in this file. If it will
still be true in December, it does. When a durable fact changes, edit it here and append the
decision to DECISIONS.md.

## Durable facts

- **Team:** CareerBridge (5 members). Roles and logistics: [team/TEAM.md](team/TEAM.md).
- **Tech stack:** Java Spring Boot — Spring Boot 4, Java 17, Maven, Spring Data JPA, H2, JUnit, the setup of Design Studio 4 (D-018, which replaced the Node.js stack of D-004). Chosen because most members do not know JavaScript and everyone learns Spring in class. Frontend: Next.js (TypeScript) with Tailwind and daisyUI, one theme in `globals.css`. Backend in `app/`, frontend in `app/frontend/`.
- **Customer:** Dr. Ren acts as the customer. Requirements answers we wrote so far are the team's assumptions pending his confirmation: [team/QUESTIONS.md](team/QUESTIONS.md).
- **Grading guidance is per-deliverable**, not global: read the active deliverable's `status.md` and the instructor's [Common Documentation Pitfalls](deliverables/deliverable-2/pitfalls.md) before writing any section.
- **AI use in this project is allowed and encouraged** as an engineering tool, but every member must be able to explain their own artifacts: [course/project-ai-usage-policy.md](course/project-ai-usage-policy.md).
- **Admin model:** still open with the customer — two levels under discussion, platform System Admin vs Company Admin (D-005).

## Conventions

- **Source of truth is this repo (markdown).** Google Docs / Word docs on OneDrive are team-facing surfaces for calls/submission (D-016); after editing a doc, sync the canonical `.md` file (e.g., Deliverable 0: [deliverables/deliverable-0/deliverable-0.md](deliverables/deliverable-0/deliverable-0.md) ↔ the team Google Doc linked in its header).
- Decisions get IDs (`D-xxx`) in [team/DECISIONS.md](team/DECISIONS.md); customer questions get IDs (`Q-xxx`) in [team/QUESTIONS.md](team/QUESTIONS.md); every meeting gets a log in [meetings/](meetings/).
- After a team meeting or a decision in chat: use the **memory-ingest** skill (it appends to DECISIONS.md / QUESTIONS.md, adds a meeting log, refreshes STATUS.md, commits).
- Before submitting any deliverable, and when asked to check the memory: use the **memory-lint** skill.
- To compare a Google Doc against its canonical md (and always before exporting a deliverable): use the **doc-sync** skill. Submission chain: doc-sync → memory-lint → export → submit.
- To start the next deliverable from its Canvas assignment page: use the **deliverable-new** skill (creates the folder, assignment.md, the working deliverable-N.md, and its Google Doc).
- Course documents in English; never add Claude/AI attribution to commits or PRs.

## Repo structure

- `STATUS.md` — the only place for "where we are now". Capped at 20 lines, overwritten rather than appended.
- `course/` — materials provided by the course (overview, roles, AI policy, the documentation template, the **example** problem statement) — not our system's requirements.
- **Naming:** Canvas numbers the submissions "Project Deliverable N"; the course *iterations* are numbered separately. **Deliverable 2 = Iteration 1** (requirements & analysis, due Sep 28); Deliverable 3 = pre-Iteration 2 (due Oct 14). Deadlines: [team/TEAM.md](team/TEAM.md).
- `deliverables/deliverable-N/` — per-deliverable: `assignment.md` (the task as given), `status.md` (its live state — owners, blockers, what is left), working notes, and the deliverable itself. When the team moves on, the folder is left as it is; only STATUS.md changes.
- `team/` — team memory: TEAM.md (who/how), DECISIONS.md (what & why), QUESTIONS.md (customer Q&A).
- `meetings/` — meeting logs (`YYYY-MM-DD-<topic>.md`).
- `.claude/` — shared Claude Code configuration: `skills/` (deliverable-new, memory-ingest, memory-lint, doc-sync, chain-review) and `workflows/` (chain-review.js, the multi-agent review the chain-review skill launches). `settings.json` enables the official `atlassian` plugin (Jira MCP), but its calls fail at the tool-execution gateway (D-012, D-013). **Use the claude.ai Atlassian connector instead** — it works since Sep 25, 2026 (D-015): board, cards, assignees, comments, worklogs. It cannot delete issues or reach admin.atlassian.com (access requests, users, billing).
- `inbox/` — drop zone for raw input (notes, chat fragments, anything); memory-ingest distills it into the memory and empties the folder. Normally empty.
