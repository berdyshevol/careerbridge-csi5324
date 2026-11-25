# Anyone searches the open jobs

**Use cases:** UC-01  
**Status:** Works

## Scenario

```gherkin
Given the open sample postings
When someone searches by keyword, location, organization or employment type
Then only the matching open postings are listed, newest first, and a search with no match says so
```

## Checked by

- `app/frontend/e2e/browse-postings.spec.ts`, the test matching "lists only open postings"
- `app/frontend/e2e/browse-postings.spec.ts`, the test matching "keyword finds postings"
- `app/frontend/e2e/browse-postings.spec.ts`, the test matching "filters narrow the list"
- `app/frontend/e2e/browse-postings.spec.ts`, the test matching "match nothing say so"

```bash
cd app/frontend && npx playwright test e2e/browse-postings.spec.ts
```
