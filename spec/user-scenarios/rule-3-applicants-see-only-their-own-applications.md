# An applicant sees only the own applications

**Use cases:** UC-05  
**Status:** Works

## Scenario

```gherkin
Given Jordan Lee's application
When Sam Rivera opens its address
Then Sam sees "not found" and none of its details
```

## Checked by

- `app/frontend/e2e/track-application-status.spec.ts`, the test matching "someone else's application URL"

```bash
cd app/frontend && npx playwright test e2e/track-application-status.spec.ts
```
