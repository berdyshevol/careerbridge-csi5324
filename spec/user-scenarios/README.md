# User scenarios

What a person can do with CareerBridge from start to finish, written as Given / When / Then in plain
English. Run them from time to time, before a demo or a deliverable, to see that the system still
does what the scenarios say.

These are the scenarios of UC-01 Search Job Postings, UC-02 Register as Applicant, UC-03 Update
Applicant Profile and Log In; the owner of another use case adds its scenarios the same way. The steps
of each use case stay in [use-cases.md](../use-cases.md); a scenario walks through the screens a person
actually uses.

## How to run them

Start the application locally as [app/README.md](../../app/README.md) says, without `app/backend/.env`,
so it runs on the in-memory database with the sample data below. Then either:

- **by hand:** open http://localhost:3000 and follow each scenario's steps; or
- **with Claude:** ask "run the user scenarios"; Claude walks each one in a browser and reports which
  steps passed and which did not.

A scenario passes when every `Then` holds. Write down the date and anything that failed.

## How a scenario is written

One scenario per file. Copy an existing one, such as [applicant-1-register.md](applicant-1-register.md).

- **File name:** `role-n-what.md`: the role is `applicant`, `recruiter` or `administrator`, and `n`
  follows the order of the minimum scope for that role. Lower case, words joined by hyphens.
- **Title:** what the person does, as a short sentence ("An applicant registers").
- **Use cases:** the use cases the scenario goes through.
- **Scenario:** one `gherkin` block.
  - `Given` the starting point, named from the sample data below, or "a visitor" for someone new.
  - `When` what the person does, with the exact names of the buttons, links and fields they use.
  - `Then` what they see, in the exact words of the page, so anyone can tell whether it passed.
  - `And` adds a line to the step above. A scenario may go When, Then, When, Then.
- Write the wording yourself; do not copy text from course pages.
- When a screen changes its wording, update the scenarios that quote it in the same pull request.

## The data the scenarios start from

The local in-memory database starts with the same sample data every time:

- **Demo accounts** (created by `config/DemoUsers.java`; emails and local passwords in the table in
  [app/README.md](../../app/README.md)): Jordan Lee and Sam Rivera (applicants), Riley Chen (recruiter),
  Avery Morgan (administrator).
- **Postings** (`app/backend/src/main/resources/data/jobs.csv`): published Junior Software Engineer,
  Data Analyst Intern, Backend Developer, IT Support Specialist and Logistics Analyst; Warehouse
  Coordinator published but past its deadline; QA Engineer closed; Product Designer pending approval;
  Marketing Coordinator a draft.
- **Jordan Lee** (`applications.csv`, loaded by `config/SampleDataLoader.java`): applications to IT
  Support Specialist at Offer, Backend Developer at Interview and Junior Software Engineer at Applied,
  and the resume Jordan_Lee_Resume.pdf. Sam Rivera has no applications and no resume.

A scenario that changes data a later scenario relies on uses a new person instead, for example a
visitor who registers. Restart the backend to get the sample data back.

## Scenarios

| Scenario | What | Use cases |
| --- | --- | --- |
| [applicant-1-register](applicant-1-register.md) | An applicant registers | UC-02 |
| [applicant-2-log-in](applicant-2-log-in.md) | An applicant logs in | Log In |
| [applicant-3-view-and-update-profile](applicant-3-view-and-update-profile.md) | An applicant views and updates the profile | UC-03 |
| [applicant-4-search-jobs](applicant-4-search-jobs.md) | Anyone searches the open jobs | UC-01 |
| [applicant-5-view-job-details](applicant-5-view-job-details.md) | Anyone opens a job's details | UC-01 |
| [recruiter-1-log-in](recruiter-1-log-in.md) | A recruiter logs in | Log In |
| [administrator-1-log-in](administrator-1-log-in.md) | The administrator logs in | Log In |
