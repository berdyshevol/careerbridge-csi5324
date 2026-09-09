# CareerBridge — project memory

Semester project for CSI 5324 (Software Engineering, Baylor, Fall 2026): a web-based **Recruiting and Application Management System** — a multi-company job board (LinkedIn-like) where organizations post jobs and applicants apply across companies.

This file is the **current-state memory** of the project. It answers "what is true now"; the history and rationale live in [team/DECISIONS.md](team/DECISIONS.md). Keep this file short and up to date — when a fact changes, edit it here and append the decision to DECISIONS.md.

## Current facts

- **Team:** CareerBridge (5 members). Roles and logistics: [team/TEAM.md](team/TEAM.md).
- **Tech stack:** JavaScript across the whole stack — Node.js backend, JS frontend. Deliberately **JavaScript, not TypeScript**. Dr. Ren approved the Node.js backend at a lecture (early Sep 2026), superseding the course's default Maven/JUnit expectation; the rationale must still be documented in Iteration 1 (D-004).
- **Customer:** Dr. Ren acts as the customer. Requirements answers we wrote so far are the team's assumptions pending his confirmation: [team/QUESTIONS.md](team/QUESTIONS.md).
- **Iteration 1 grading guidance:** Dr. Ren posted [Common Documentation Pitfalls](deliverables/deliverable-2/pitfalls.md) (Sep 9, 2026) — read it before writing any Iteration 1 section. Hard rules: analysis before implementation, use cases describe system behavior (not UI clicks), explicit system boundary with system actors, domain model = nouns only, one SSD per system operation, **no placeholders or "TBD" in the submitted PDF**, and full traceability Requirements → Use Cases → SSDs → Operation Contracts.
- **Admin model:** intentionally open for the customer. Team's working idea: two levels — platform System Admin (approves/manages organizations) vs Company Admin (manages their own recruiters). To be settled in Iteration 1 (D-005).

## Conventions

- **Source of truth is this repo (markdown).** Google Docs are team-facing surfaces for calls/submission; after editing a doc, sync the canonical `.md` file (e.g., Deliverable 0: [deliverables/deliverable-0/deliverable-0.md](deliverables/deliverable-0/deliverable-0.md) ↔ the team Google Doc linked in its header).
- Decisions get IDs (`D-xxx`) in [team/DECISIONS.md](team/DECISIONS.md); customer questions get IDs (`Q-xxx`) in [team/QUESTIONS.md](team/QUESTIONS.md); every meeting gets a log in [meetings/](meetings/).
- After a team meeting or a decision in chat: use the **memory-ingest** skill (it appends to DECISIONS.md / QUESTIONS.md, adds a meeting log, updates the facts above, commits).
- Before submitting any deliverable, and when asked to check the memory: use the **memory-lint** skill.
- To compare a Google Doc against its canonical md (and always before exporting a deliverable): use the **doc-sync** skill. Submission chain: doc-sync → memory-lint → export → submit.
- To start the next deliverable from its Canvas assignment page: use the **deliverable-new** skill (creates the folder, assignment.md, the working deliverable-N.md, and its Google Doc).
- Course documents in English; never add Claude/AI attribution to commits or PRs.

## Repo structure

- `course/` — materials provided by the course (overview, roles, the **example** problem statement) — not our system's requirements.
- **Naming:** Canvas numbers the submissions "Project Deliverable N"; the course *iterations* are numbered separately. **Deliverable 2 = Iteration 1** (requirements & analysis, due Sep 28); Deliverable 3 = pre-Iteration 2 (due Oct 14). Deadlines: [team/TEAM.md](team/TEAM.md).
- `deliverables/deliverable-N/` — per-deliverable: `assignment.md` (the task), working notes, and the deliverable itself. Deliverables are submission snapshots — do not use them as memory.
- `team/` — team memory: TEAM.md (who/how), DECISIONS.md (what & why), QUESTIONS.md (customer Q&A).
- `meetings/` — meeting logs (`YYYY-MM-DD-<topic>.md`).
- `.claude/` — shared Claude Code configuration: `skills/` (deliverable-new, memory-ingest, memory-lint, doc-sync). `settings.json` re-enables the official `atlassian` plugin (Jira MCP) for the whole team as of Sep 9, 2026 — a retry of the failure recorded in D-012, unverified so far (D-013); each member authenticates with `/mcp`. If calls still fail with "We are having trouble completing this action", fall back to the Jira web UI or the REST API with a personal API token.
- `inbox/` — drop zone for raw input (notes, chat fragments, anything); memory-ingest distills it into the memory and empties the folder. Normally empty.
