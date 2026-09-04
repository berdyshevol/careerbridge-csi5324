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

Before a deliverable submission the full chain is: **doc-sync → memory-lint → export PDF/DOCX → submit**; after submission, record the snapshot fact in DECISIONS.md.
