# Nobody applies to a closed posting

**Use cases:** UC-04, UC-13  
**Status:** Works

## Scenario

```gherkin
Given a posting past its deadline (Warehouse Coordinator) or closed (QA Engineer)
When an applicant opens it or sends an application to the backend
Then the page no longer offers to apply and the backend refuses the application
```

## Checked by

- `app/frontend/e2e/expire-job-posting.spec.ts`, the test matching "backend refuses an application"
- `app/frontend/e2e/browse-postings.spec.ts`, the test matching "closed posting still opens but no longer offers"

```bash
cd app/frontend && npx playwright test e2e/browse-postings.spec.ts e2e/expire-job-posting.spec.ts
```
