# Anyone opens a job's details

**Use cases:** UC-01  
**Status:** Works

## Scenario

```gherkin
Given the open posting Backend Developer at Brazos Analytics
When someone opens it from the job board
Then its title, organization, details and requirements are shown
```

## Checked by

- `app/frontend/e2e/browse-postings.spec.ts`, the test matching "a posting opens with its details"

```bash
cd app/frontend && npx playwright test e2e/browse-postings.spec.ts
```
