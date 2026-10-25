# ADR-0010: Users log in for a signed token, and each endpoint asks for a role

- **Status:** Accepted
- **Date:** 2026-10-25
- **Replaces:** [ADR-0006](0006-public-backend-is-read-only-without-login.md) and
  [ADR-0007](0007-administrator-signs-in-with-http-basic.md)

## Context

Every operation that changes data was built before anyone could log in. ADR-0006 therefore made
the public backend read-only, and ADR-0007 let only one in-memory Administrator sign in, with HTTP
Basic. Iteration 1 feedback lists log-in among the features to build first, and the final
deliverable asks for role-based access control. The frontend (Vercel) and the backend (Render) are
on different sites, so a session cookie set by the backend would be a third-party cookie, which
browsers increasingly block. The feedback also asks for no external services.

## Decision

- Accounts are the `User` rows (Applicant, Recruiter, Administrator, ADR-0005). A user keeps a
  BCrypt hash of the password, never the password (NFR-UC02.1). Five failed log-ins within 15
  minutes lock the account for 15 minutes (A15).
- `POST /api/auth/login` checks the email and password and answers with a JWT signed by the
  backend (HS256, secret `JWT_SECRET`), valid for 8 hours, with the email as subject and the role
  as a claim. No identity provider and no session cookie: the frontend keeps the token and sends it
  as `Authorization: Bearer …`; Spring Security's resource server checks it.
- Reading postings needs no log-in (BR-3). Applicant operations need the Applicant role, posting
  writes the Recruiter role, `/api/admin/**` the Administrator role.
- Demo accounts, one per role, are created at start-up from passwords in the environment
  (`DEMO_*_PASSWORD`); the repository holds no real password.
- The HTTP Basic administrator of ADR-0007 is removed as soon as the administrator page uses the
  token; the read-only switch of ADR-0006 once every write checks its role.

## Consequences

- Logging out is the frontend forgetting the token; a stolen token stays valid until it expires.
- Without `JWT_SECRET` the backend signs with a random key, so a restart logs everybody out. Render
  needs the variable set.
- A token is readable by the page's scripts, so the frontend must not render untrusted HTML.
- Register (UC-02) and the other use cases that create accounts reuse the same hash and token.
