---
name: chain-review
description: Review a member's Iteration 1 chain (FR + NFR → use case → SSD → operation contracts) for consistency, completeness and Dr. Ren's requirements. Runs the chain-review workflow (4 reviewers + skeptics + judge), then weighs every proposed fix itself and gives its own verdict. Use when the user says "check / review my chain", "проверь UC-02", "проверь FR-03.2", "review Rabeya's use cases", or after finishing a chain file.
---

# Chain review (orchestrator)

The workflow finds problems; **this skill decides what to do about them.** Never forward the
workflow's verdict as is.

## 1. Resolve what to review

The user may give any of these; turn it into chain file(s) under `deliverables/deliverable-2/chains/`:

| Input | Resolves to |
|---|---|
| a use case, `UC-02` | `chains/uc-02-*.md` |
| a requirement, `FR-02.3` / `NFR-02.1` | its use case (`FR-<UC>.<n>`) → `chains/uc-02-*.md`; mention in the report which requirement the user asked about |
| a member, "Rabeya" | her use cases from the ownership table in `team-guide.md` → one review per chain file |
| a path | that file |

If the file does not exist, say so and stop (offer to draft the chain first, using
`chains/uc-01-browse-job-postings.md` as the reference layout). Note the current git branch and
whether the file has uncommitted changes — the review reads the file on disk.

## 2. Run the workflow

Call the Workflow tool with the saved workflow and parameters — do not copy or edit the script:

```
Workflow({ name: "chain-review", args: { target: "<absolute path>", ucId: "UC-02" } })
```

One run per chain file (several files → several runs; they can run at the same time). It runs in
the background (~4–5 min, 9 agents); tell the user it started and what it checks, then wait for
the completion notification. If the notification's result is truncated, read the `verdict` agent's
result from `journal.jsonl` in the run's transcript directory.

## 3. Own judgment — the part that matters

Re-open the chain file (it may have changed while the workflow ran) and go through **every** fix
the workflow proposes. For each one decide:

| Decision | When |
|---|---|
| **Apply** | a real error a grader would mark down: broken traceability, contradiction, missing template field, TBD/draft text, untestable requirement, wrong contract form |
| **Apply, simpler** | right problem, but the proposed fix is heavier than needed for Iteration 1 — say what the lighter fix is |
| **Needs <member>** | the fix is in someone else's use case, the diagram or the domain model — name the owner (`team-guide.md`) and draft a one-line message for them; prefer a fix that keeps this chain self-contained |
| **Skip** | taste, over-engineering, implementation/security detail beyond analysis level, or already fixed — give the reason |

This is a course project — **simplicity wins**. Reviews tend to inflate a chain (split this FR,
add that extension); reject anything that makes it bigger without a clear grading reason, and keep
each use case near 5 FRs, 3 NFRs and 4–5 extensions.

Weigh it against: the rubric and pitfalls (`assignment.md`, `pitfalls.md`), the deadline and
what is left (`status.md`), the team conventions (`team-guide.md`), and earlier decisions on this
file (`git log -p` on it — do not undo a fix made on purpose). The workflow's score is input, not
the answer: give **your own** verdict and score, and say where you disagree with the workflow.

## 4. Report

In the user's language (Russian for Oleg), short:

1. Own verdict and score (and the workflow's, if different).
2. Table: fix → decision (Apply / Apply simpler / Needs X / Skip) → one-line reason.
3. What is already good (keep it).
4. Messages for other members, if any, ready to paste.

Do not edit files until the user agrees. After applying, commit to the chain's branch and push
if a PR is open. Don't re-run the workflow after every edit — once more when all of a member's
chains are done is enough.
