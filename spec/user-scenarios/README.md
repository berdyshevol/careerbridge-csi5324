# User scenarios

What a person can do with CareerBridge, end to end and across roles, written as Given / When / Then.
Each file is one scenario: the use cases it goes through, and the end-to-end test that proves it or
the ticket that will build it. Run them all from time to time to see what works; when a scenario
that was not built gets its test, change its status here and in its file.

These are the scenarios of UC-01 Search Job Postings, UC-02 Register as Applicant, UC-03 Update
Applicant Profile and Log In; the owner of another use case adds its scenarios the same way. They follow
the order of the course's minimum scope for the final iteration (applicant, recruiter, administrator).
The steps of each use case stay in [use-cases.md](../use-cases.md); a scenario only strings them together.

## The data the scenarios start from

Every run starts from the same sample data, so a scenario names it instead of creating it:

- **Demo accounts** ([e2e/accounts.ts](../../app/frontend/e2e/accounts.ts), created by `config/DemoUsers.java`):
  Jordan Lee and Sam Rivera (applicants), Riley Chen (recruiter), Avery Morgan (administrator).
- **Postings** (`app/backend/src/main/resources/data/jobs.csv`): published Junior Software Engineer,
  Data Analyst Intern, Backend Developer, IT Support Specialist and Logistics Analyst; Warehouse
  Coordinator published but past its deadline; QA Engineer closed; Product Designer pending approval;
  Marketing Coordinator a draft.
- **Jordan Lee's applications** (`applications.csv`, loaded by `config/SampleDataLoader.java`): IT
  Support Specialist at Offer, Backend Developer at Interview, Junior Software Engineer at Applied,
  and a resume on file. Sam Rivera has no applications.

A scenario that needs anything else creates it in its own steps, for example a new applicant who
registers, or a posting the recruiter submits and the administrator approves. That keeps the shared
sample data the same for every scenario.

## Run them

```bash
cd app/frontend && npm run test:e2e
```

The end-to-end tests start their own backend on a fresh database with this sample data.

## Scenarios

| Scenario | What | Use cases | Status |
| --- | --- | --- | --- |
| [applicant-1-register](applicant-1-register.md) | An applicant registers | UC-02 | Works |
| [applicant-2-log-in](applicant-2-log-in.md) | An applicant logs in | Log In | Works |
| [applicant-3-view-and-update-profile](applicant-3-view-and-update-profile.md) | An applicant views and updates the profile | UC-03 | Works |
| [applicant-4-search-jobs](applicant-4-search-jobs.md) | Anyone searches the open jobs | UC-01 | Works |
| [applicant-5-view-job-details](applicant-5-view-job-details.md) | Anyone opens a job's details | UC-01 | Works |
| [recruiter-1-log-in](recruiter-1-log-in.md) | A recruiter logs in | Log In | Works |
| [administrator-1-log-in](administrator-1-log-in.md) | The administrator logs in | Log In | Works |
