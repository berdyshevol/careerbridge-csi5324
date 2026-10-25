# ADR-0007: The Administrator signs in with HTTP Basic until Log In exists

- **Status:** Replaced by [ADR-0010](0010-log-in-with-jwt.md)
- **Date:** 2026-10-13

## Context

UC-12 Approve Job Posting requires that only accounts with the Administrator role approve, return
or reject postings. Log In and the user accounts it needs are not built yet. Without some check,
anyone who can reach `/api/admin/**` could publish postings.

## Decision

Spring Security protects `/api/admin/**` with HTTP Basic and one in-memory user with the role
ADMIN, whose name and password come from `careerbridge.admin.username` and
`careerbridge.admin.password` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`). On a developer's machine they
default to `admin` / `admin`. The Docker image sets an empty password, so the public deployment has
no administrator, and [ADR-0006](0006-public-backend-is-read-only-without-login.md) still makes it
read-only. Every other path stays open, as before. CSRF protection is off because no session cookie
is issued: each request carries its own credentials.

The page `/admin/postings` asks for the credentials, sends them with each request, and refuses to
send them to a backend that is not on `localhost`.

## Consequences

- UC-12 can be demonstrated and tested locally, including the Playwright flow, with `admin` / `admin`.
- The deciding Administrator recorded on a posting (`approvedBy`) is the HTTP Basic user name, not
  an Administrator entity.
- Spring Security's default headers apply to every response; frames are allowed from the same
  origin so the H2 console still works.
- When Log In exists, it replaces the in-memory user, the role comes from the Administrator entity,
  and a new record replaces this one.
