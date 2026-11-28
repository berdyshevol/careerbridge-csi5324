# ADR-0015: A lifecycle is a transition table

- **Status:** Accepted
- **Date:** 2026-11-28

## Context

An application's stage, a posting's status and an offer's status changed through public setters
called from the services. Each service also appended the history entry by hand. As a result:

- any class could set any status, so Hired back to Applied compiled and ran;
- the arrows of Figure 3 (BR-8) were written out three times: in `Application.isWithdrawable`, in
  `availableActions` and in the service checks;
- a stage could change without its history entry;
- a posting was closed in two ways, by `JobPosting.close` and by setting its fields in
  `ApplicationService`.

UC-14 and UC-15 are about to add the remaining moves of Figure 3. Three designs were built as
prototypes and compared (SCRUM-267, SCRUM-268):

- the rules inside the entities;
- a hand-written transition table and engine in a `lifecycle` package;
- typed transition records with domain events.

The state-machine libraries for Java were also checked:

- Spring Statemachine was archived on 2026-07-05, and its last open-source release is built on
  Spring Framework 6.2, not 7.
- stateless4j and squirrel-foundation have had no release since 2019 and 2022.

## Decision

1. **Each lifecycle is one table** in the `lifecycle` package: `ApplicationLifecycle` (Figure 3),
   `JobPostingLifecycle` (Figure 4) and `OfferLifecycle` (the answers to an offer). A row names the
   states it leaves, the event, the state it reaches, its refusals in the order the use case lists
   them, each with the reason for the screen, and its effect. The events are the system operations
   of the contracts.
2. **One engine runs every table.** `StateMachine` (about 200 lines, no library) finds the row,
   returns the first refusal, or moves the state and runs the effect. The new state and its history
   entry are written together.
3. **The entities keep the data.** `Application`, `JobPosting` and `Offer` have no status setters,
   only the writers the rows call (`enterStage`, `enterStatus`, `recordDecision`, `recordClosing`
   and the like).
4. **The service keeps the system operation, under the same name.** It:
   - finds the actor and checks what needs a query;
   - loads and locks the rows, the posting before the application;
   - passes the table the facts it cannot query itself, in the table's `Move`;
   - fires the event and saves.

   Examples of such facts: the number already hired, and whether the submitting Recruiter is still
   an active member.
5. **A refusal says why.** The table returns a `Refusal` with the rule's name and its reason; the
   service turns it into the exception the controller answers with. The applicant's buttons come
   from the same table (`availableActions`).
6. **The tables are the only way in.** `LayersTest` fails when:
   - a class outside `lifecycle` calls an entity's state writer (`onlyTheLifecycleChangesAState`);
   - a class outside a service or `config` fires a table (`onlyServicesFireALifecycle`), because
     a move fired on an entity a service already returned would run unlocked, outside the
     transaction, and never be saved;
   - the `lifecycle` package depends on Spring or Jakarta, so a row is tested with `new`.
7. **Tests and sample data** reach a state by walking the table (`restore`) and firing the last
   event (`LifecycleFixtures`), so they cannot build a state that the figures forbid.
   `LifecyclesMatchTheSpecTest` compares each table with its figure; a table also prints itself as
   Mermaid (`toMermaid`).

## Consequences

- A whole lifecycle, with its refusals, reads on one screen, as the figure does. A new arrow is a
  new row, a change to the figure and to `LifecyclesMatchTheSpecTest` in one pull request.
- The engine is our own code to keep. A rule is a lambda over `Move`, so a mistake in a row shows at
  run time in the tests, not at compile time.
- The entity writers are public so that the table can call them; only `LayersTest`, not the
  compiler, keeps other classes away from them.
- `spec/architecture.md` and `spec/design.md` say that the service loads, locks, fires the table and
  saves. The sequence diagrams show the table, not setters.
- UC-14 and UC-15 add only service methods, controllers and screens: their rows exist already.
