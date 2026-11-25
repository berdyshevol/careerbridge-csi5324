# A recruiter creates a job posting

**Use cases:** UC-11, UC-12  
**Status:** Works

## Scenario

```gherkin
Given Riley Chen logged in
When Riley fills in title, description, requirements and deadline, saves a draft and submits it
Then the posting waits for the administrator, and once approved it is on the job board
```

## Checked by

- `app/frontend/e2e/approve-job-posting.spec.ts`, the test matching "approved posting appears on the job board"

```bash
cd app/frontend && npx playwright test e2e/approve-job-posting.spec.ts
```
