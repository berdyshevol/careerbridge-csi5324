# An applicant withdraws an application

**Use cases:** UC-06  
**Status:** Works

## Scenario

```gherkin
Given a new applicant with one active application
When they withdraw it and confirm
Then its stage is Withdrawn, the slot frees up, and they cannot apply to that posting again
```

## Checked by

- `app/frontend/e2e/withdraw-application.spec.ts`, the test matching "withdraws after confirming"

```bash
cd app/frontend && npx playwright test e2e/withdraw-application.spec.ts
```
