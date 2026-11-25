# A failed action says what went wrong

**Use cases:** all  
**Status:** Works

## Scenario

```gherkin
Given a wrong password, a search with no match or an email that is already registered
When the user tries it
Then the page says what went wrong and how to go on
```

## Checked by

- `app/frontend/e2e/log-in.spec.ts`, the test matching "given a wrong password"
- `app/frontend/e2e/browse-postings.spec.ts`, the test matching "match nothing say so"
- `app/frontend/e2e/register.spec.ts`, the test matching "already has an account"

```bash
cd app/frontend && npx playwright test e2e/browse-postings.spec.ts e2e/log-in.spec.ts e2e/register.spec.ts
```
