# Accounts, postings and applications survive a restart

**Use cases:** all  
**Status:** Checked by hand

## Scenario

```gherkin
Given an applicant registered and an application sent on the deployed site
When the backend restarts (Render sleeps after 15 minutes without visits)
Then the applicant still logs in and the application is still on Applications
```

## How to check

Checked by hand on the deployed site: data lives in PostgreSQL on Neon (ADR-0009). The local tests start a fresh database each run.
