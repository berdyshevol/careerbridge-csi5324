# An applicant logs in

**Use cases:** Log In  
**Status:** Works

## Scenario

```gherkin
Given Jordan Lee's account
When Jordan logs in from the header
Then the header shows Jordan Lee as an applicant and Jordan is back on the page
```

## Checked by

- `app/frontend/e2e/log-in.spec.ts`, the test matching "given a demo applicant, when they log in"

```bash
cd app/frontend && npx playwright test e2e/log-in.spec.ts
```
