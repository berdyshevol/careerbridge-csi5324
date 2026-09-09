# Decision log

Append-only. One row per decision; newer rows at the bottom. Reference decisions as `D-xxx` from any document. When a decision changes a current fact, also update [CLAUDE.md](../CLAUDE.md).

| ID | Date | Decision | Context / source |
| --- | --- | --- | --- |
| D-001 | 2026-09-02 | Follow the course's example problem domain: Recruiting and Application Management System, scoped as a **multi-company job board (LinkedIn-like)** — many organizations post jobs, applicants apply across companies. | Team call ([log](../meetings/2026-09-02-team-call.md)); recorded in Deliverable 0. |
| D-002 | 2026-09-02 | Team name: **CareerBridge**. | Team call. |
| D-003 | 2026-09-02 | Role assignments: PM — Zeba Tusnia Towshi; Requirements — Rabeya Nazara; Design — Josh Job Joseph; QA — Reagan Rubio; Librarian — Oleg Berdyshev (see [TEAM.md](TEAM.md)). | Team call. |
| D-004 | 2026-09-02 | Tech stack: **JavaScript on both frontend and backend (Node.js)**; deliberately JS, **not TypeScript** (one language across the stack). Dr. Ren verbally approved the Node.js backend at a lecture, superseding the course's Maven/JUnit default; rationale still to be documented in Iteration 1. | Team poll + lecture approval (early Sep 2026). |
| D-005 | 2026-09-03 | Admin model **left open for the customer**: the Deliverable 0 answer to Q-013 stays neutral about which admin approves accounts. Team's working idea (not submitted): two levels — platform **System Admin** approves/manages organizations; **Company Admin** manages their own recruiters/hiring managers. To be settled in Iteration 1. | Team chat debate; clarification message by Oleg. |
| D-006 | 2026-09-03 | Answers in Deliverable 0 are framed as the **team's working assumptions** for the customer to confirm or correct (note added at the top of section 3). | Assignment wording; team chat. |
| D-007 | 2026-09-03 | Documentation convention: **repo markdown is the source of truth**; Google Docs are team-facing surfaces for calls/submission and are synced from the repo. | Oleg (Project Librarian). |
| D-008 | 2026-09-03 | Deliverable lifecycle formula (refines D-007): **doc = surface, md = truth, deliverable = snapshot** exported from the doc at a moment when doc == md. Enforced by the `doc-sync` skill; submission chain: doc-sync → memory-lint → export PDF/DOCX → submit. | Discussion Oleg ↔ Claude. |
| D-009 | 2026-09-08 | Scrum platform: **Jira**. Chosen on the team call for Deliverable 1; Dr. Ren is to be added as stakeholder for user story acceptance. Tooling: the official `atlassian` Claude Code plugin (Atlassian MCP server) is installed in Oleg's environment so issues/sprints can be managed from the repo workflow. | Team call, Sep 8, 2026. |
