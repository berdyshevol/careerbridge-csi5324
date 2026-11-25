# Nobody applies twice to the same posting

**Use cases:** UC-04  
**Status:** Works

## Scenario

```gherkin
Given Jordan Lee's application to Backend Developer
When Jordan tries to apply to it again
Then it is refused and Jordan is told why
```

## Checked by

- `app/frontend/e2e/apply-for-job.spec.ts`, the test matching "already applied to cannot be applied"

```bash
cd app/frontend && npx playwright test e2e/apply-for-job.spec.ts
```
