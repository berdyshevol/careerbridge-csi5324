# ADR-0005: Applicant, Recruiter and Administrator are stored with joined-table inheritance

- **Status:** Accepted
- **Date:** 2026-10-13

## Context

The [domain model](../domain-model.md) (section 5.2) makes Applicant, Recruiter and Administrator
specializations of User, with no attributes of their own. With single-table inheritance, the
default, Hibernate adds a discriminator column with a check constraint, and H2 rejected every
insert into it, including the inserts of the existing `User` test.

## Decision

`User` is mapped with `@Inheritance(strategy = InheritanceType.JOINED)`. Each specialization is an
entity that extends `User` and has its own table, keyed by the same id.

## Consequences

- A query for a specialization joins its table to `users`.
- A specialization that later gets attributes of its own needs no change to `users`.
- The decision applies to Recruiter and Administrator too, when they are added.
