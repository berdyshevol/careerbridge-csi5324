# An applicant applies to an open job

**Use cases:** UC-04  
**Status:** Works

## Scenario

```gherkin
Given Jordan Lee with a resume on file
When Jordan reviews and confirms an application to an open posting
Then the application is submitted and counts toward the 5 active applications
```

## Checked by

- `app/frontend/e2e/apply-for-job.spec.ts`, the test matching "reviews, confirms and submits"

```bash
cd app/frontend && npx playwright test e2e/apply-for-job.spec.ts
```
