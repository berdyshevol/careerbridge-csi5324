# ADR-0009: Data lives in PostgreSQL on Neon; tests run on PostgreSQL in Docker

- **Status:** Accepted
- **Date:** 2026-10-25
- **Replaces:** the H2 database of [ADR-0001](0001-spring-boot-and-nextjs.md)

## Context

The in-memory H2 database loses every application, posting and account when the backend restarts,
and Render restarts it on every deploy. Log In needs accounts that survive a restart, and the final
deliverable asks for persistent data and recommends PostgreSQL or MySQL. The tests ran on H2, so
they did not check the database a deployment would use.

## Decision

- The backend reads `DATABASE_URL`, `DATABASE_USERNAME` and `DATABASE_PASSWORD`: from the
  environment on Render, from the git-ignored `app/backend/.env` on a developer's machine. The
  database is PostgreSQL on Neon's free plan, project `careerbridge`: branch `main` for Render,
  branch `dev` for local runs. Without `DATABASE_URL` the backend still starts on in-memory H2.
- JUnit tests, and the backend the Playwright tests start (`./mvnw spring-boot:test-run`), use a
  fresh PostgreSQL in Docker through the Testcontainers JDBC URL in
  `src/test/resources/config/application.properties`. They never touch the Neon database.
- When Docker is not running, the same tests use an in-memory H2 database instead and log a
  warning (`TestDatabaseFallback` in the test sources; amended 2026-10-28). CI and Deploy have
  Docker, so every merge and every deploy is still checked on PostgreSQL.
- Hibernate keeps creating and updating the tables (`ddl-auto=update`). Sample data loads only
  into an empty database.

## Consequences

- The tests run without Docker, but only a run with Docker checks PostgreSQL. GitHub's runners
  have it, so a difference between H2 and PostgreSQL shows up in the pull request at the latest.
- A member without `.env` works on H2 as before; H2 and PostgreSQL can differ, and only the tests
  catch that.
- A change to an entity that `update` cannot apply (a new required column on a table with rows)
  needs the `dev` branch reset, or a migration tool once the data matters.
- Neon suspends an idle database after 5 minutes; the first query after that waits for it to wake.
