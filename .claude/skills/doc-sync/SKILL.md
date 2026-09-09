---
name: doc-sync
description: Diff a team Google Doc against its canonical markdown file (the source of truth) and report discrepancies. Use when the user asks to sync/check the doc, asks "can we submit?", and always before exporting any deliverable to PDF/DOCX.
---

# Doc sync

The convention (D-007/D-008): the Google Doc is the team-facing **surface**, the repo markdown is the **source of truth**, and a deliverable is a **snapshot** exported from the doc at a moment when doc == md.

## Procedure

1. Identify the pair: the canonical md (e.g., `deliverables/deliverable-N/deliverable-N.md`) and the Google Doc linked in its header. Read both (Doc via the Google Drive connector).
2. Compare content, ignoring formatting noise (bold/markup artifacts, list renumbering, whitespace). Compare meaning, not bytes.
3. Report in three buckets:
   - **In the doc, not in md** — teammates added something → propose ingesting it (memory-ingest: D-xxx/Q-xxx, update md).
   - **In md, not in the doc** — our changes not yet on the surface → output exact paste-ready text and where to insert it (Claude cannot edit Google Docs; the user pastes).
   - **Conflicts** — same item stated differently → md is the arbiter, but show the conflict and let the user decide.
4. Also flag doc-only defects worth fixing before submission (garbled names, broken numbering).
5. Verdict, explicitly: ✅ "doc == md — safe to export and submit" or ⚠️ "N discrepancies — not ready".

## Known non-discrepancies

Do not report these as differences:

- The md's repo-only header blockquote ("**Source of truth.**", assignment/course links, due date) — by design it never goes into the Doc (see the `deliverable-new` skill).
- **Part 1 — Call agenda (REMOVE BEFORE SUBMISSION)** while the deliverable is still being worked on: it belongs in both. At submission time it is removed from **both** the Doc and the md (the agenda is archived to `meetings/`, its decisions ingested as D-xxx) — so if it is gone from one and not the other, say so as a step still to finish, not as a conflict.

Before a deliverable submission the full chain is: **doc-sync → memory-lint → export PDF/DOCX → submit**; after submission, record the snapshot fact in DECISIONS.md.
