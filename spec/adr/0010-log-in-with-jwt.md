# ADR-0010: A session is a token the backend signs

- **Status:** Accepted
- **Date:** 2026-10-25

## Context

UC-02 Register as Applicant ends with the new Applicant logged in. Nobody could log in before: the
only account with a password was the HTTP Basic administrator (ADR-0007), and the public backend
refuses every write (ADR-0006). The frontend (Vercel) and the backend (Render) are on different
sites, so a session cookie set by the backend would be a third-party cookie, which browsers
increasingly block. Iteration 1 feedback asks for no external services.

## Decision

- A user keeps a BCrypt hash of the password, never the password (NFR-UC02.1).
- A session is a JWT the backend signs (HS256, secret `JWT_SECRET`), valid for 8 hours, with the
  email as subject and the role as a claim. No identity provider. Register (UC-02) starts one;
  Log In will start the same kind.
- The frontend keeps the session in a cookie on its own site, so the server-rendered header shows
  who is logged in; logging out is forgetting it.
- Registering needs nobody logged in, so `POST /api/applicants` is the one write the read-only
  switch of ADR-0006 lets through.

## Consequences

- No endpoint reads the token yet: UC-04 still acts for the sample applicant until Log In and the
  role checks arrive.
- Without `JWT_SECRET` the backend signs with a random key, so a restart ends every session.
  Render needs the variable set.
- A token is readable by the page's scripts, so the frontend must not render untrusted HTML.
- Anyone can create applicant accounts, on the public site too: there is no rate limit or CAPTCHA.
- Registering with an address that has an account says so (UC-02 extension 4b), which tells a
  visitor that the address is registered; with no email to warn the owner, that is the trade-off.
  The refusal suggests logging in, which works once Log In is built.
