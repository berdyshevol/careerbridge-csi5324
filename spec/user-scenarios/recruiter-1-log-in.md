# A recruiter logs in

**Use cases:** Log In  
**Status:** Works

## Scenario

```gherkin
Given Riley Chen's recruiter account
When Riley logs in
Then the header shows Riley as a recruiter, and logging out offers to log in again
```

## Checked by

- `app/frontend/e2e/log-in.spec.ts`, the test matching "logged-in recruiter, when they log out"

```bash
cd app/frontend && npx playwright test e2e/log-in.spec.ts
```
