# An applicant registers

**Use cases:** UC-02  
**Status:** Works

## Scenario

```gherkin
Given a visitor with no account
When they register with a full name, an email and a password
Then they are logged in on their profile, and they can log in again with that email
```

## Checked by

- `app/frontend/e2e/register.spec.ts`, the test matching "when they register, then they are logged in"

```bash
cd app/frontend && npx playwright test e2e/register.spec.ts
```
