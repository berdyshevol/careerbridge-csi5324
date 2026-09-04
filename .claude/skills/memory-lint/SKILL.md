---
name: memory-lint
description: Health-check the project memory for contradictions, staleness, and broken links across CLAUDE.md, team/, meetings/, and deliverables/. Use when the user asks to check/verify the memory, before submitting any deliverable, and after large reorganizations.
---

# Memory lint

Verify the memory is consistent and current. Read-only by default: report findings; fix them only when the user confirms (or when the fix is trivially mechanical, like a broken relative link).

## Checks

1. **CLAUDE.md vs DECISIONS.md** — every "current fact" in CLAUDE.md must be backed by a decision row, and no later D-xxx may contradict a stated fact. The latest decision wins; flag any fact CLAUDE.md states that DECISIONS.md has superseded.
2. **QUESTIONS.md statuses** — flag `assumption`/`open` rows that events have overtaken (e.g., the customer answered but the row wasn't updated). Verify Q-xxx referenced from other files exist.
3. **Deliverables vs memory** — deliverable files are frozen snapshots and may legitimately lag; flag only where a deliverable states something as *current* that memory contradicts, or where a deliverable was edited after submission without a decision recorded.
4. **Cross-references** — all `D-xxx`/`Q-xxx` mentions resolve to existing rows; all relative markdown links in CLAUDE.md, README.md, team/, meetings/, deliverables/ point to existing files.
5. **Staleness** — TBD items in TEAM.md older than ~2 weeks; meetings that happened (per the weekly cadence in TEAM.md) but have no log; the newest decision being much older than recent significant commits.
6. **ID integrity** — D-xxx and Q-xxx sequences have no duplicates or gaps.

## Output

A short report: ✅ what's consistent, ⚠️ findings ordered by severity, each with the exact file/row and a proposed one-line fix. If everything passes, say so in one line.
