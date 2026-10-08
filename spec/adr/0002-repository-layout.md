# ADR-0002: Repository layout

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

The Spring project first sat directly in `app/`, with the frontend inside it as `app/frontend/`, so
it was not obvious which part was the backend. Documents were spread over several top-level folders.

## Decision

```
spec/            the specification: requirements, use cases, models, design, architecture, ADRs
app/backend/     the Spring Boot project
app/frontend/    the Next.js project
.github/         continuous integration and deployment workflows
```

`spec/` holds the current version of each document, split by topic. Submitted deliverables and
working notes are not kept in the repository.

## Consequences

- A newcomer sees two folders and knows where to look.
- The specification changes in the same pull requests as the code it describes.
- A deliverable PDF is assembled from the files in `spec/`.
