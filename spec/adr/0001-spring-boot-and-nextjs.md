# ADR-0001: Backend on Spring Boot, frontend on Next.js

- **Status:** Accepted
- **Date:** 2026-10-07
- **Replaces:** the earlier choice of JavaScript on Node.js for the whole stack (team poll, 2026-09-02)

## Context

The team first chose JavaScript on Node.js for both backend and frontend. By the start of
Iteration 2 it was clear that most members do not know JavaScript, while every member is learning
Java and Spring in the course's design studios. The course's default tooling is also Maven and JUnit.

## Decision

- **Backend:** Java 17, Spring Boot 4, Maven, Spring Data JPA, H2, JUnit — the setup of Design
  Studio 4. It serves JSON only.
- **Frontend:** Next.js with TypeScript, styled with Tailwind and daisyUI (one theme). It holds no
  business rules.

## Consequences

- Every member can write and test the business rules of their use cases in a language they are
  learning in class.
- The system has two parts to run and deploy instead of one.
- The frontend needs JavaScript knowledge; pages are thin, so that work stays small.
- The stack sentence in section 2.2 of the Iteration 1 documentation is replaced
  ([vision.md](../vision.md)).
