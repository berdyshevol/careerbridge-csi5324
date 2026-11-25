# An applicant sees the own applications and their stage

**Use cases:** UC-05  
**Status:** Works

## Scenario

```gherkin
Given Jordan Lee's three applications (Offer, Interview, Applied)
When Jordan opens Applications and then one application
Then each is listed with its current stage, and the detail page shows the stage history
```

## Checked by

- `app/frontend/e2e/track-application-status.spec.ts`, the test matching "see their list, active count"
- `app/frontend/e2e/track-application-status.spec.ts`, the test matching "stage history and interview details"

```bash
cd app/frontend && npx playwright test e2e/track-application-status.spec.ts
```
