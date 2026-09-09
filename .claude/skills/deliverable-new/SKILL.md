---
name: deliverable-new
description: Bootstrap the next project deliverable end to end — read its Canvas assignment page, create deliverables/deliverable-N/ with assignment.md and the working deliverable-N.md (call agenda + submission draft), create the matching Google Doc in the team Drive folder, link them, commit and push. Use when the user says "let's start the next deliverable", "давай перейдём к deliverable N", or gives a Canvas assignment link for a project deliverable.
---

# New deliverable

One command turns a Canvas assignment into a ready workspace: the task on file, a working document the team can use on the call, and its Google Doc surface.

## Inputs

- **Canvas assignment URL** — ask for it if the user did not give one ("Which Canvas page?"). Do not guess the URL.
- Deliverable number and topic come from the page title (e.g., "Project Deliverable 1 - Scrum & GitHub" → N=1, topic "Scrum & GitHub").

## Procedure

1. **Read Canvas** with the Chrome browser tools: `tabs_context_mcp` → `navigate` → `get_page_text`. Capture the due date, point value, submission format (PDF/DOCX, group or individual), every numbered task, and any extra role-specific task. Check the course announcements too if the user mentions one.
2. **Create `deliverables/deliverable-N/`.**
3. **Write `assignment.md`** — the task as given: a `> Source:` blockquote with the Canvas link, due date, points, submission type; then "## Tasks", "## What to submit", any extra tasks; end with "## Related documents" linking `../../course/*` and the previous deliverable. This file is a source copy — never edit its substance later, only add links/notes.
4. **Write `deliverable-N.md`** — the working document, in two parts:
   - Header blockquote: "**Source of truth.**" + link to the Google Doc (placeholder until step 5) + assignment link, due date, submission format.
   - **Part 1 — Call agenda, <date> (REMOVE BEFORE SUBMISSION)**: the decisions the team must make, each with the trade-offs and a recommendation, plus an empty "task / owner / by" table to fill in on the call. Flag deadline collisions with the weekly slot in `team/TEAM.md`.
   - **Part 2 — The deliverable (this is what gets submitted)**: exactly the sections the assignment asks for, with `TBD` placeholders for what the team has yet to produce. Pull known facts from memory (team name, roles, project description, repo URL) instead of asking.
5. **Create the Google Doc** in the team Drive folder `1aMqUWLVgIuw58KbVYDwubasuRgtBqPLQ` (same folder as the earlier deliverables), titled `CSI 5324 – Deliverable N (<topic>)`, `contentMimeType: text/markdown`, content = the md **minus** the repo-only header blockquote. Then write the doc URL back into the md header.
6. **Commit and push** everything in one commit; report the doc link and what the team must decide.

## The lifecycle to state back to the user

doc = surface where the team works (call agenda + draft) → md = source of truth → before submission: delete Part 1, run **doc-sync**, then **memory-lint**, export the PDF, submit → afterwards move the agenda into `meetings/` and let **memory-ingest** record the call's decisions.
