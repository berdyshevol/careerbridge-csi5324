# Each role reaches only its own pages

**Use cases:** Log In  
**Status:** Works

## Scenario

```gherkin
Given an applicant, a recruiter and a visitor
When each opens a page of another role
Then they are told it is not for their role, or asked to log in, and the backend refuses their requests
```

## Checked by

- `app/frontend/e2e/log-in.spec.ts`, the test matching "told only an administrator reviews postings"
- `app/frontend/e2e/apply-for-job.spec.ts`, the test matching "given a recruiter, when they ask to apply"
- `app/frontend/e2e/apply-for-job.spec.ts`, the test matching "given no log-in, when someone posts"
- `app/frontend/e2e/role-shell.spec.ts`, the test matching "navigation holds only"

```bash
cd app/frontend && npx playwright test e2e/apply-for-job.spec.ts e2e/log-in.spec.ts e2e/role-shell.spec.ts
```
