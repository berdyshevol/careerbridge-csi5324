# An applicant's resume goes with the application

**Use cases:** UC-03, UC-04  
**Status:** Works

## Scenario

```gherkin
Given a new applicant without a resume
When they try to apply, upload a PDF resume and come back
Then the Apply page shows that resume and a copy of it is sent with the application
```

## Checked by

- `app/frontend/e2e/update-profile.spec.ts`, the test matching "choose a PDF resume"
- `app/frontend/e2e/apply-for-job.spec.ts`, the test matching "without a resume, when they apply"

```bash
cd app/frontend && npx playwright test e2e/apply-for-job.spec.ts e2e/update-profile.spec.ts
```
