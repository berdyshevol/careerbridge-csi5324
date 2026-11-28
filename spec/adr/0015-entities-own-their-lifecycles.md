# ADR-0015: Entities own their lifecycles

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
prototypes and compared (SCRUM-267):

- the rules inside the entities;
- a hand-written transition table and engine in a `lifecycle` package;
- typed transition records with domain events.

The state-machine libraries for Java were also checked:

- Spring Statemachine was archived on 2026-07-05, and its last open-source release is built on
  Spring Framework 6.2, not 7.
- stateless4j and squirrel-foundation have had no release since 2019 and 2022.

## Decision

1. **The arrows live on the status enum.** `ApplicationStatus`, `PostStatus` and `OfferStatus` each
   have `allowedMoves()`, which draws their figure (Figure 3, Figure 4, the answers to an offer).
   `LifecyclesMatchTheSpecTest` compares them with the figures and prints both as Mermaid when
   they differ.
2. **The entity has one operation per system operation:**
   - `Application`: `withdraw`, `advance`, `reject`, `recordInterview`, `extendOffer`,
     `reviseOffer`, `acceptOffer`, `declineOffer`.
   - `JobPosting`: `submit`, `approve`, `returnToRecruiter`, `reject`, `closeByRecruiter`, `fill`,
     `expire`.
   - `Offer`: its answers, which only `Application` calls.

   Every operation checks its rule. Its stage change goes through one private `moveTo`, which asks
   the enum and appends the history entry in the same step.
3. **No status setters.** The status history and the interviews are read-only lists outside the
   entity. Tests and sample data reach a stage by running the operations that lead to it
   (`Lifecycles` in the tests, `SeedLifecycle` in `config`), so they cannot build a state that the
   figures forbid.
4. **The service keeps the system operation, under the same name.** It:
   - finds the actor and checks what needs a query;
   - loads and locks the rows, the posting before the application;
   - passes the entity the facts it cannot query itself;
   - calls the operation and saves.

   Examples of such facts: the number already hired, and the other active applications that
   `JobPosting.fill` rejects when the last opening is filled.
5. **A refusal says why.** An entity's refusal is an exception in `model`, with a reason for the
   screen: `ApplicationActionRefusedException`, `OfferRevisedException` or
   `PostingStateConflictException`. The applicant's buttons come from the same checks
   (`availableActions`). A refusal that only the service can decide (not found, not allowed,
   invalid input) stays in `service`.
6. **Only a service or `config` calls an operation.** `LayersTest.onlyServicesMoveALifecycle`
   fails when a controller or any other class does. Called on an entity that a service already
   returned, an operation would run unlocked, outside the transaction, and never be saved.

## Consequences

- A move that is not an arrow of its figure cannot happen. A new arrow is a change to the enum,
  the figure and `LifecyclesMatchTheSpecTest` in one pull request.
- `spec/architecture.md` and `spec/design.md` say that the service loads, locks, calls the entity's
  operation and saves. The sequence diagrams show the operations, not setters.
- New tests build their data through `Lifecycles`, which takes a little longer to write than a
  setter.
- A JPA entity now holds rules as well as data. There is still one class per conceptual class of
  the domain model, under the same name. A separate domain model mapped to JPA classes was not
  chosen, because it would double the model classes.
- UC-14 and UC-15 add only service methods, controllers and screens: their moves exist already.
