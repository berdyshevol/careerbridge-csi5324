# Deliverable 2 / Iteration 1 — what each member writes

> The short version of [assignment.md](assignment.md) and [pitfalls.md](pitfalls.md) for the team.
> Posted to the team chat on 2026-09-25. Docs due **Mon Sep 28, 2026**; presentation **Tue Sep 29**.
> Working document: [deliverable-2.md](deliverable-2.md).

## The chain

Each of us writes the **full chain for our own use cases**, not just the use cases:

```
FRs + NFRs  ->  Use cases  ->  SSDs  ->  Operation contracts
```

Every item links to the previous one. Traceability is graded (pitfall 7).

## Who owns what

| Member | Use cases | FRs + NFRs | Use cases | SSDs | Operation contracts |
|---|---|---|---|---|---|
| Oleg | UC-01 – UC-03 | SCRUM-46 | SCRUM-28 | SCRUM-34 | SCRUM-51 |
| Rabeya | UC-04 – UC-07 | SCRUM-47 | SCRUM-25 | SCRUM-31 | SCRUM-52 |
| Reagan | UC-08 – UC-10 | SCRUM-48 | SCRUM-27 | SCRUM-33 | SCRUM-53 |
| Zeba | UC-11 – UC-13 | SCRUM-49 | SCRUM-24 | SCRUM-30 | SCRUM-54 |
| Josh | UC-14 – UC-17 | SCRUM-50 | SCRUM-26 | SCRUM-32 | SCRUM-55 |

Shared parts: Project Scope & Vision — Zeba (SCRUM-18) · AI feature scope — Rabeya (SCRUM-21) ·
Domain Model — Reagan (SCRUM-29) · Wireframes — Josh (SCRUM-38).

Jira board: <https://careerbridge-csi5324.atlassian.net/jira/software/projects/SCRUM/boards/1> —
move your card to In Progress / Done, and log time on it (card → ⋯ → Log work).

## How many (best practice)

- **FRs:** about 3 per use case — keep it simple, this is a course project. One requirement = one testable sentence ("The system shall…").
  Number them `FR-<UC>.<n>` — e.g. FR-04.1, FR-04.2 for UC-04 — so the use case is part of the ID;
  NFRs the same way (NFR-04.1). Example: [chains/uc-01-browse-job-postings.md](chains/uc-01-browse-job-postings.md).
  Every feature we plan must appear in at least one use case. A use case usually realizes several
  FRs; an FR shared by several use cases (e.g. "must be logged in") is the exception.
- **NFRs:** 1–2 per use case, measurable (e.g. "search results appear within 2 seconds"). Take them
  from the Special Requirements section of your use cases.
- **Use cases:** your 3 (or 4) from Josh's doc. Review them and make sure you can defend them.
- **SSDs:** 1 per use case (main success scenario). Actor ↔ System as one black box, no internal
  objects or method calls. Not too detailed, but not one "do everything" message either.
  Title each one `SSD-<nn>: UC-<nn> <name>` so it is traceable once pasted into §6.
- **Operation contracts:** 1 per system operation, i.e. each arrow from the actor to the system in
  your SSD. Usually 2–4 per SSD. Each contract: Operation, Cross-references (UC), Preconditions,
  Postconditions. Postconditions list state changes only; for a query operation write "None —
  query operation" and add an **Output** row with what it returns.

To check a finished chain, ask Claude Code: "review UC-02" (the `chain-review` skill).

## Dr. Ren's pitfalls (where points get lost)

Full page: <https://baylor.instructure.com/courses/257917/pages/iteration-1-common-documentation-pitfalls-read-carefully>
(our copy: [pitfalls.md](pitfalls.md)).

- Use cases describe what the system does and guarantees, not UI clicks. No "user clicks button →
  system shows page".
- Every use case needs alternative flows (extensions) and business rules.
- No "TBD" or placeholders anywhere. Write it as if the client will read it.
- Same names and IDs everywhere (FR-xx, UC-xx, same operation names in SSD and contract). The chain
  FR → UC → SSD → contract must be easy to follow.
