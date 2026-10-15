# Slice a use case

A use case is too big for one pull request. Cut it into vertical slices: each one goes from the
backend to the screen with its tests and leaves something that works. You draft the slices; the
person who owns the use case edits and approves them, because the course grades that analysis as
theirs. No code and no pull request here.

1. **Read** the use case in `spec/use-cases.md`, its FRs in `spec/requirements.md`, its SSD and
   contracts in `spec/ssd-and-contracts.md`, the entities in `spec/domain-model.md`, and the code
   that already exists for it.
2. **Read the epic** `UC-NN <name>` in Jira and every ticket under it, with their `Covers:` lines.
   What is Done or In Progress is not sliced again.
3. **Draft the slices**, in this order:
   - slice 1, the walking skeleton: the main success scenario's first system operation from the
     SSD, end to end, including the entities and endpoint it needs;
   - one slice per remaining system operation of the main scenario;
   - one slice per extension, or per group of small ones.

   Each slice is 1–2 hours. Larger: split it again by step, data or rule. Too small to change what
   the user sees: merge it into a neighbour.
4. **Shared prerequisites** that other use cases need too — log in, Notification, Interview,
   Recruiter — are not sliced here. Name the existing ticket, or propose one `Process · <what>`
   ticket, and list it under `Depends on:`.
5. **Show the draft** as a table: summary `UC-NN · <what>`, `Covers: FR-…; steps…; ext…`,
   `Depends on: …`, and hours. Ask the person to change, merge or drop slices. Wait for their OK.
6. **Before creating, search the epic again**, in case someone else sliced it meanwhile. Then
   create each approved slice: a Story in the active sprint, parent the epic, the `Covers:` and
   `Depends on:` lines in its description, unassigned.
7. **Offer to start slice 1.** On a yes, take its ticket through the pipeline in `SKILL.md`.
