# Inbox — drop zone for raw input

Drop anything here that should end up in the project memory: meeting notes, pasted chat fragments, screenshots, customer answers, half-formed thoughts. Any format, any language, messy is fine.

Then tell Claude to **ingest** (or just mention you dropped something). The `memory-ingest` skill will distill each file into the memory — decisions → `team/DECISIONS.md`, questions/answers → `team/QUESTIONS.md`, meetings → `meetings/`, changed facts → `CLAUDE.md` — and delete the processed file in the same commit (its raw content stays recoverable in git history, and the commit message names it).

This folder should normally be empty: anything sitting here is unprocessed input.
