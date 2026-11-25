# User scenarios

What a person can do with CareerBridge from start to finish, written as Given / When / Then in plain
English. Every scenario comes from a use case in [use-cases.md](../use-cases.md), its main success
scenario or one of its extensions, and names the item of the course's minimum scope for the final
iteration that it shows. Run them from time to time, before a demo or a deliverable, to see that the
system still does what the use cases say.

These are the scenarios of UC-01 Search Job Postings, UC-02 Register as Applicant, UC-03 Update
Applicant Profile and Log In; the owner of another use case adds its scenarios the same way.

## How to run them

Start the application locally as [app/README.md](../../app/README.md) says, without `app/backend/.env`,
so it runs on the in-memory database with the sample data below. Then either:

- **by hand:** open http://localhost:3000 and follow each scenario's steps; or
- **with Claude:** ask "run the user scenarios"; Claude walks each one in a browser and reports which
  steps passed and which did not.

A scenario passes when every `Then` holds. Restart the backend to get the sample data back.

## How a scenario is written

One scenario per file. Copy an existing one, such as [applicant-1-register.md](applicant-1-register.md).

- **File name:** `role-n-what.md` for a use case's main success scenario and `role-n-what-outcome.md`
  for one of its extensions. The role is `applicant`, `recruiter` or `administrator`, and `n` is the
  number of the minimum-scope item it shows for that role. Lower case, words joined by hyphens.
- **Title:** what happens, as a short sentence ("An applicant registers").
- **Use case:** the use case and the steps or extension the scenario walks through.
- **Minimum scope:** the item it shows (role and number), and any system-wide requirement it also shows
  (validation, meaningful errors, permissions by role).
- **Scenario:** one `gherkin` block.
  - `Given` the starting point, named from the sample data below, or a person the scenario creates.
  - `When` what the person does, with the exact names of the buttons, links and fields.
  - `Then` what they see, in the exact words of the page, so anyone can tell whether it passed.
  - `And` adds a line to the step above; a scenario may go When, Then, When, Then. A line starting
    with `#` is a note.
- Write the wording yourself; do not copy text from course pages.
- When a use case or a screen's wording changes, update its scenarios in the same pull request.

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

A scenario that would change data another scenario relies on uses a person it creates instead, such
as a visitor who registers.

## Scenarios

| Scenario | Use case | Minimum scope |
| --- | --- | --- |
| [applicant-1-register](applicant-1-register.md) | UC-02 Register as Applicant: main success scenario, steps 1–3 | Applicant 1 (register) |
| [applicant-1-register-fields-wrong](applicant-1-register-fields-wrong.md) | UC-02: extensions 2a and 2c | Applicant 1; the system validates input |
| [applicant-1-register-email-taken](applicant-1-register-email-taken.md) | UC-02: extension 2b | Applicant 1; meaningful errors |
| [applicant-1-register-recruiter-instead](applicant-1-register-recruiter-instead.md) | UC-02: extension 1a (continues in UC-08) | Applicant 1 |
| [applicant-2-log-in](applicant-2-log-in.md) | Log In: the user enters email and password, the system starts a session with the role | Applicant 2 (log in) |
| [applicant-2-log-in-wrong-password](applicant-2-log-in-wrong-password.md) | Log In: an unknown email and a wrong password get the same answer | Applicant 2; meaningful errors |
| [applicant-2-log-in-locked](applicant-2-log-in-locked.md) | Log In: 5 failed attempts in 15 minutes lock the account for 15 minutes (A15) | Applicant 2; the system authenticates users |
| [applicant-2-log-in-other-roles-pages](applicant-2-log-in-other-roles-pages.md) | Log In: the role decides what the user can reach | Applicant 2; permissions follow the role |
| [applicant-3-view-and-update-profile](applicant-3-view-and-update-profile.md) | UC-03 Update Applicant Profile: main success scenario, steps 1–4 | Applicant 3 (view and update own profile) |
| [applicant-3-update-profile-phone-wrong](applicant-3-update-profile-phone-wrong.md) | UC-03: extension 4a | Applicant 3; the system validates input |
| [applicant-4-search-jobs](applicant-4-search-jobs.md) | UC-01 Search Job Postings: main success scenario, steps 1–2 | Applicant 4 (browse and search jobs) |
| [applicant-4-search-jobs-no-match](applicant-4-search-jobs-no-match.md) | UC-01: extension 2b | Applicant 4; meaningful errors |
| [applicant-5-view-job-details](applicant-5-view-job-details.md) | UC-01: step 2, the posting's details (shown on its page, UC-04 step 1) | Applicant 5 (view a job's details) |
| [applicant-7-upload-resume](applicant-7-upload-resume.md) | UC-03: steps 5–7 | Applicant 7 (the resume that goes with an application; UC-04 attaches a copy of it) |
| [applicant-7-upload-resume-wrong-file](applicant-7-upload-resume-wrong-file.md) | UC-03: extension 6a | Applicant 7; the system validates input |
| [recruiter-1-log-in](recruiter-1-log-in.md) | Log In | Recruiter 1 (log in) |
| [administrator-1-log-in](administrator-1-log-in.md) | Log In: returns to the page that sent the user to log in | Administrator 1 (log in) |

## Coverage

**Minimum scope.** Of the items that belong to these use cases, every one has a scenario:
Applicant 1 (register), 2 (log in), 3 (view and update own profile), 4 (browse and search jobs),
5 (view a job's details) and 7 (the resume that goes with an application, uploaded in UC-03), Recruiter 1
and Administrator 1 (log in). The system-wide requirements shown here are input validation, meaningful
errors, authentication and permissions by role. Applicant 6, 8 and 9 and the other recruiter and
administrator items belong to UC-04 to UC-15.

**Use cases.** Every main success scenario has a scenario, and so does every extension a person can
reach on the sample data, except:

| Use case | Not covered | Why |
| --- | --- | --- |
| UC-01 | 2a: no posting is open at all | The sample data always has open postings. |
| UC-01, UC-02, UC-03 | \*a: the system fails | Needs the backend to fail in the middle of a request. |
| Log In | A recruiter in Pending Approval sees only the request's status | Needs UC-08, not on main yet. |
