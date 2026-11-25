# An applicant views and updates the profile

**Use cases:** UC-03  
**Status:** Works

## Scenario

```gherkin
Given a logged-in applicant
When they change the phone and the headline and save
Then both are still there after a reload
```

## Checked by

- `app/frontend/e2e/update-profile.spec.ts`, the test matching "when they open their profile"
- `app/frontend/e2e/update-profile.spec.ts`, the test matching "change their phone and headline"

```bash
cd app/frontend && npx playwright test e2e/update-profile.spec.ts
```
