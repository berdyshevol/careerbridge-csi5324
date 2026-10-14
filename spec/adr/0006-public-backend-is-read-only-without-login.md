# ADR-0006: The public backend changes no data until users can log in

- **Status:** Accepted
- **Date:** 2026-10-13

## Context

UC-11 Create Job Posting is implemented before any login exists (UC-02, UC-08 and Log In are not
built yet). `POST /api/postings` therefore cannot know who is calling: it takes the organization
from the request, and anyone who can reach the backend can create postings for any organization.
On a developer's machine that is harmless. The backend on Render is public. Every operation that
changes data and is built before login has the same problem.

## Decision

The backend's Docker image, which is what runs on Render, sets `PUBLIC_DEPLOYMENT=true`
(`careerbridge.public-deployment`; false when the variable is absent). On a public deployment
every request under `/api` that is not a read is answered with 403 and a sentence for the user,
before the request reaches a controller. The posting form shows that sentence.

## Consequences

- Forms that save work on a developer's machine and in the tests, which do not use the image.
- On the public site a form that saves is still shown, and says that saving is switched off only
  after it is submitted.
- A demonstration of saving on the public site is not possible until login exists.
- A backend started on a public address without the image is not protected.
- When users can log in, each operation checks its caller (BR-15), the switch is removed, and a
  new record replaces this one.
