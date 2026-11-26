# ADR-0014: The database schema comes from Flyway migrations

- **Status:** Accepted
- **Date:** 2026-11-26
- **Replaces:** the point "Hibernate keeps creating and updating the tables (`ddl-auto=update`)" of
  [ADR-0009](0009-postgresql-on-neon.md)

## Context

Hibernate built and updated the tables itself (`ddl-auto=update`). It adds missing tables and
columns, but never changes what already exists. On PostgreSQL it guards every enum column with a
check that lists the values the enum had when the table was created. When `AccountStatus` gained
`PENDING_APPROVAL` and `INACTIVE`, the check on the Neon `main` branch kept the old list, and on
November 26 the deployed backend crashed on every start: the demo recruiter requests (SCRUM-233)
were refused by the database (SCRUM-251). The tests did not see it, because they always start from
an empty database, where the check is built with the current values.

## Decision

1. **Flyway builds the schema.** The migrations are SQL files named `V<number>__<what>.sql` in
   `app/backend/src/main/resources/db/migration/common`, which run on every database (Neon, the
   PostgreSQL of the tests, H2), and in `db/migration/postgresql` for what only PostgreSQL needs.
   On every start the backend applies the ones the database has not had yet and records them in
   `flyway_schema_history`.
2. **Hibernate only checks** (`ddl-auto=validate`): the backend does not start when a table,
   column or type differs from the entities.
3. **`MigrationsMatchEntitiesTest` compares the rest.** `validate` does not look at constraints,
   so the test builds the schema Hibernate derives from the entities next to the one the
   migrations built, on PostgreSQL, and fails with the difference: columns, nullability,
   checks (enum values), keys and sequences.
4. **A change to an entity comes with its migration** in the same pull request: a new file with
   the next number. A migration that has reached `main` is never edited, because a database that
   already ran it would not run it again.
5. **V1 is the schema as it was** on November 26. A database that already has tables but no
   history (the Neon branches `main` and `dev`) is marked as being at V1
   (`baseline-on-migrate`) and gets only the later migrations. V2, for PostgreSQL only, drops
   every check on an enum column, whatever its name, and writes it again with the current values;
   H2 is always built from V1 and does not need it.

## Consequences

- An entity change without a migration fails the tests of its pull request instead of the
  deployed backend.
- A change that `update` could not make (a renamed column, a new required column on a table with
  rows, a removed enum value) is now a migration written by hand, with the data step it needs.
- `EnumColumnChecks`, which dropped one stale check on every start (SCRUM-232), is removed: V2
  covers every enum column.
- The fields `Resume.content` and `ResumeSnapshot.content` name their type (`VARBINARY`), because
  at 5 MB Hibernate expects a blob on H2 and `bytea` on PostgreSQL, and one migration has to suit
  both.
