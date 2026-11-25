# Invalid input is refused field by field

**Use cases:** UC-02, UC-03, UC-11  
**Status:** Works

## Scenario

```gherkin
Given a registration with a one-word name and a weak password, or a profile with a malformed phone number
When it is sent
Then each field says what is wrong and nothing is saved
```

## Checked by

- `app/frontend/e2e/register.spec.ts`, the test matching "one-word name and a weak password"
- `app/frontend/e2e/update-profile.spec.ts`, the test matching "malformed phone number"
- `app/frontend/e2e/update-profile.spec.ts`, the test matching "choose a text file"

```bash
cd app/frontend && npx playwright test e2e/register.spec.ts e2e/update-profile.spec.ts
```
