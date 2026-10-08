---
name: memory-ingest
description: Ingest raw team input (meeting notes, chat decisions, customer answers, files dropped into spec/inbox/) into the project memory — spec/meetings/, spec/team/DECISIONS.md, spec/team/QUESTIONS.md, STATUS.md, the active deliverable's status.md, and CLAUDE.md only for durable facts. Use whenever the user shares meeting notes, says "we decided…", reports the customer's (Dr. Ren's) answer, asks to record/log a decision or meeting, or says to ingest / process the inbox.
---

# Memory ingest

Turn raw input into structured project memory. The user provides sources and context; you maintain the wiki.

Input arrives two ways: directly in the conversation, or as files dropped into `spec/inbox/` (any format; see `spec/inbox/README.md`). When asked to ingest with no input given, check `spec/inbox/` for unprocessed files (everything except its README).

## Procedure

0. **Inbox files**: read every unprocessed file in `spec/inbox/`, apply steps 1–6 to each, then delete the processed files in the same commit — their raw content stays in git history, and the commit message must name them.
1. **Read the current memory first**: `STATUS.md`, `CLAUDE.md`, `spec/team/DECISIONS.md`, `spec/team/QUESTIONS.md`, `spec/team/TEAM.md`, and the active deliverable's `status.md`. Never assign an ID without checking the last used D-xxx / Q-xxx.
2. **Meeting log** (if the input describes a meeting/call): create `spec/meetings/YYYY-MM-DD-<topic>.md` — attendees, decisions (referencing D-xxx), outcomes, follow-ups. If the input is a chat decision only, a log is optional; the decision entry's Context column is enough.
3. **Decisions**: append one row per decision to `spec/team/DECISIONS.md` (next D-xxx, date, decision, context/source). Append-only — never rewrite old rows; a reversed decision gets a NEW row that references the old one ("supersedes D-00x").
4. **Questions**: new customer questions → new Q-xxx rows in `spec/team/QUESTIONS.md` (status `open` or `assumption`). Customer answers → update the row's status to `confirmed` with the customer's wording and date.
5. **Route each fact to the right file — this is the step that keeps CLAUDE.md from rotting:**
   - *Will be false within ~2 weeks* (progress, who is doing what now, the current blocker, a new next action) → `STATUS.md` and/or the active deliverable's `status.md`. **Overwrite** the relevant lines; never append. `STATUS.md` has a hard 20-line cap — if an edit would exceed it, the detail belongs in the deliverable's `status.md` instead.
   - *Will still be true in December* (stack, team, customer, conventions, repo structure) → `CLAUDE.md`.
   - *Answered customer question or settled ambiguity* → the Q-xxx row, plus remove it from the blockers line in `STATUS.md`.
   - Never copy per-deliverable detail into `CLAUDE.md`, and never leave `STATUS.md` pointing at a finished deliverable.
6. **Ambiguity**: if the input is unclear (who decided? final or proposal?), record what is certain and ask the user about the rest — do not invent details.
7. **Commit** all touched files in one commit (e.g., `Memory: D-008 <short decision>; log 2026-09-15 meeting`) and push to the current branch. No AI attribution in the message.
8. **Report back**: list the IDs created/updated so the user can reference them.
