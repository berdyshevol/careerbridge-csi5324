# User scenarios

What a person can do with CareerBridge, end to end and across roles, written as Given / When / Then.
Each file is one scenario: the use cases it goes through, and the end-to-end test that proves it or
the ticket that will build it. Run them all from time to time to see what works; when a scenario
that was not built gets its test, change its status here and in its file.

The scenarios follow the order of the course's minimum scope for the final iteration (applicant,
recruiter, administrator, then the rules the whole system keeps). The steps of each use case stay in
[use-cases.md](../use-cases.md); a scenario only strings them together.

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
| [applicant-6-apply](applicant-6-apply.md) | An applicant applies to an open job | UC-04 | Works |
| [applicant-7-resume-with-the-application](applicant-7-resume-with-the-application.md) | An applicant's resume goes with the application | UC-03, UC-04 | Works |
| [applicant-8-own-applications-and-status](applicant-8-own-applications-and-status.md) | An applicant sees the own applications and their stage | UC-05 | Works |
| [applicant-9-withdraw](applicant-9-withdraw.md) | An applicant withdraws an application | UC-06 | Works |
| [recruiter-1-log-in](recruiter-1-log-in.md) | A recruiter logs in | Log In | Works |
| [recruiter-2-create-posting](recruiter-2-create-posting.md) | A recruiter creates a job posting | UC-11, UC-12 | Works |
| [recruiter-3-view-and-change-own-postings](recruiter-3-view-and-change-own-postings.md) | A recruiter views and changes the own postings | UC-11, UC-14 | Not built yet |
| [recruiter-4-close-own-posting](recruiter-4-close-own-posting.md) | A recruiter closes an own posting | Close Job Posting | Not built yet |
| [recruiter-5-applications-to-own-postings](recruiter-5-applications-to-own-postings.md) | A recruiter sees the applications to an own posting | UC-14 | Not built yet |
| [recruiter-6-review-applicant](recruiter-6-review-applicant.md) | A recruiter reviews an applicant | UC-14 | Not built yet |
| [recruiter-7-change-application-stage](recruiter-7-change-application-stage.md) | A recruiter changes an application's stage | UC-14, UC-05 | Not built yet |
| [administrator-1-log-in](administrator-1-log-in.md) | The administrator logs in | Log In | Works |
| [administrator-2-users-and-roles](administrator-2-users-and-roles.md) | The administrator sees the users and their roles | none yet | Not built yet |
| [administrator-3-manage-recruiter-accounts](administrator-3-manage-recruiter-accounts.md) | The administrator manages recruiter accounts | UC-08, UC-10 | Not built yet |
| [rule-1-no-applying-to-closed-postings](rule-1-no-applying-to-closed-postings.md) | Nobody applies to a closed posting | UC-04, UC-13 | Works |
| [rule-2-no-duplicate-active-applications](rule-2-no-duplicate-active-applications.md) | Nobody applies twice to the same posting | UC-04 | Works |
| [rule-3-applicants-see-only-their-own-applications](rule-3-applicants-see-only-their-own-applications.md) | An applicant sees only the own applications | UC-05 | Works |
| [rule-4-recruiters-manage-only-their-own-postings](rule-4-recruiters-manage-only-their-own-postings.md) | A recruiter manages only the own organization's postings | UC-11, UC-14 | Not built yet |
| [rule-5-stage-changes-reach-the-applicant](rule-5-stage-changes-reach-the-applicant.md) | A stage change is saved and the applicant sees it | UC-14, UC-05 | Not built yet |
| [rule-6-each-role-reaches-only-its-own-pages](rule-6-each-role-reaches-only-its-own-pages.md) | Each role reaches only its own pages | Log In | Works |
| [rule-7-invalid-input-is-refused](rule-7-invalid-input-is-refused.md) | Invalid input is refused field by field | UC-02, UC-03, UC-11 | Works |
| [rule-8-failures-say-what-went-wrong](rule-8-failures-say-what-went-wrong.md) | A failed action says what went wrong | all | Works |
| [rule-9-data-survives-a-restart](rule-9-data-survives-a-restart.md) | Accounts, postings and applications survive a restart | all | Checked by hand |
| [documentation-1-test-cases-name-their-tester](documentation-1-test-cases-name-their-tester.md) | Every test case names who wrote and ran it | spec/testing.md | Not built yet |
