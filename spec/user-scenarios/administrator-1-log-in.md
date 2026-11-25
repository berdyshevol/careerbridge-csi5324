# The administrator logs in

**Use cases:** Log In  
**Status:** Works

## Scenario

```gherkin
Given Avery Morgan's administrator account
When Avery opens the approval page and logs in
Then Avery is back on the approval queue
```

## Checked by

- `app/frontend/e2e/log-in.spec.ts`, the test matching "log in as the administrator"

```bash
cd app/frontend && npx playwright test e2e/log-in.spec.ts
```
