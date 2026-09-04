---
name: memory-ingest
description: Ingest raw team input (meeting notes, chat decisions, customer answers) into the project memory — meetings/, team/DECISIONS.md, team/QUESTIONS.md, CLAUDE.md. Use whenever the user shares meeting notes, says "we decided…", reports the customer's (Dr. Ren's) answer, or asks to record/log a decision or meeting.
---

# Memory ingest

Turn raw input into structured project memory. The user provides sources and context; you maintain the wiki.

## Procedure

1. **Read the current memory first**: `CLAUDE.md`, `team/DECISIONS.md`, `team/QUESTIONS.md`, `team/TEAM.md`. Never assign an ID without checking the last used D-xxx / Q-xxx.
2. **Meeting log** (if the input describes a meeting/call): create `meetings/YYYY-MM-DD-<topic>.md` — attendees, decisions (referencing D-xxx), outcomes, follow-ups. If the input is a chat decision only, a log is optional; the decision entry's Context column is enough.
3. **Decisions**: append one row per decision to `team/DECISIONS.md` (next D-xxx, date, decision, context/source). Append-only — never rewrite old rows; a reversed decision gets a NEW row that references the old one ("supersedes D-00x").
4. **Questions**: new customer questions → new Q-xxx rows in `team/QUESTIONS.md` (status `open` or `assumption`). Customer answers → update the row's status to `confirmed` with the customer's wording and date.
5. **Current facts**: if any fact in `CLAUDE.md` changed (stack, roles, conventions, logistics in TEAM.md), update it. CLAUDE.md must always reflect "true now".
6. **Ambiguity**: if the input is unclear (who decided? final or proposal?), record what is certain and ask the user about the rest — do not invent details.
7. **Commit** all touched files in one commit (e.g., `Memory: D-008 <short decision>; log 2026-09-15 meeting`) and push to the current branch. No AI attribution in the message.
8. **Report back**: list the IDs created/updated so the user can reference them.
