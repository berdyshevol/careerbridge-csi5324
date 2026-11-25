# User scenarios

What a person can do with CareerBridge, end to end and across roles, written as Given / When / Then.
Each file is one scenario: the use cases it goes through, and the end-to-end test that proves it or
the ticket that will build it. Run them all from time to time to see what works; when a scenario
that was not built gets its test, change its status here and in its file.

These are the scenarios of UC-01 Search Job Postings, UC-02 Register as Applicant, UC-03 Update
Applicant Profile and Log In; the owner of another use case adds its scenarios the same way. They follow
the order of the course's minimum scope for the final iteration (applicant, recruiter, administrator).
The steps of each use case stay in [use-cases.md](../use-cases.md); a scenario only strings them together.

## How a scenario is written

One scenario per file. Copy an existing one, such as [applicant-1-register.md](applicant-1-register.md).

**File name:** `<role>-<n>-<what>.md`, where the role is `applicant`, `recruiter` or `administrator`
and `n` follows the order of the minimum scope for that role; `rule-<n>-<what>.md` for a rule the whole
system keeps. Lower case, words joined by hyphens.

**Sections, in this order:**

1. `# <Title>`: what a person does, as a short sentence in the present tense ("An applicant registers").
2. `**Use cases:**` the use cases the scenario goes through (`UC-02`, `Log In`), and `**Status:**` one of
   *Works*, *Not built yet* or *Checked by hand*.
3. `## Scenario`: one `gherkin` block with
   - `Given` the starting point, named from the sample data below (Jordan Lee, Backend Developer), or
     created by the scenario itself (a new applicant who registers);
   - `When` what the person does, in the words a user would use, not field names or endpoints;
   - `Then` what they see afterwards, which a test can check. `And` adds a line to any of the three.
4. `## Checked by` (when it works): one line per end-to-end test that proves it, as
   `` `app/frontend/e2e/<file>.spec.ts`, the test matching "<words from its title>" ``, then the
   command that runs those files.
5. `## Not checked yet` (when it is not built): the ticket that will build it, `SCRUM-NN`, or "No ticket
   yet". `## How to check` instead for a scenario checked by hand: the steps to follow.

**Rules:**

- A scenario strings use cases together; it does not repeat their steps or extensions, which stay in
  [use-cases.md](../use-cases.md). One scenario, one outcome: a second outcome is a second file.
- Write the wording yourself; do not copy text from course pages.
- When a scenario's test is added or a test it names is renamed, update its "Checked by" lines, its
  status, and its row in the table at the end of this file, in the same pull request.

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
