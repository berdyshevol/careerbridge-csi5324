# User scenarios

What a person can do with CareerBridge from start to finish: acceptance criteria for the use cases,
written as Gherkin scenarios (Feature, Scenario, Given / When / Then) in plain English and walked
through by hand or by Claude on the running application, not by a test runner. Every scenario comes from a use case in [use-cases.md](../use-cases.md), its main success
scenario or one of its extensions, and names the item of the course's minimum scope for the final
iteration that it shows. Run them from time to time, before a demo or a deliverable, to see that the
system still does what the use cases say.

These are the scenarios of UC-01 Search Job Postings, UC-02 Register as Applicant, UC-03 Update
Applicant Profile and Log In; the owner of another use case adds its scenarios the same way.

## How to run them

Start the application locally as [app/README.md](../../app/README.md) says, without `app/backend/.env`,
so it runs on a fresh in-memory database. Then either:

- **by hand:** open http://localhost:3000 and follow each scenario's steps; or
- **with Claude:** ask "run the user scenarios"; Claude walks each one in a browser and reports which
  steps passed and which did not.

A scenario passes when every `Then` holds. Its steps say what to do, not where to click: use the
screens a person would use for it.

## How a scenario is written

One scenario per file. Copy an existing one, such as
[applicant-1-register-email-taken.md](applicant-1-register-email-taken.md). The style follows Dave
Farley's acceptance tests: the scenario says **what** the system does, in the words of the use case,
never **how** a screen does it, so it stays true when the screens change.

- **File name:** `role-n-what.md` for a use case's main success scenario and `role-n-what-outcome.md`
  for one of its extensions. The role is `applicant`, `recruiter` or `administrator`, and `n` is the
  number of the minimum-scope item it shows for that role. Lower case, words joined by hyphens.
- **Title:** the outcome, as a sentence ("Registration is refused when an account already exists for
  the email"). The `Scenario:` line repeats it.
- **Use case:** the use case and the steps or extension the scenario walks through.
- **Minimum scope:** the item it shows (role and number), and any system-wide requirement it also shows
  (validation, meaningful errors, permissions by role).
- **Scenario:** one `gherkin` block: `Feature:` with the use case's number and name, a blank line, then
  `Scenario:` indented by 2 spaces and the steps by 4.
  - Domain language only: what a person achieves and what the system decides ("registers", "is
    refused because an account already exists for that email"). No buttons, fields, page titles,
    addresses or exact messages.
  - `Given` creates the data the scenario needs and names it with a short alias (`an applicant "Sam"
    is registered`, `an open posting "Backend Developer"`). A scenario never relies on another
    scenario or on the shared sample data. Two exceptions, because the system cannot create these
    roles yet: `a recruiter "Riley" with an active account` and `the administrator`.
  - Each `Then` is an outcome the use case requires, including what must not happen ("no new account
    is created"). One scenario, one outcome.
- Write the wording yourself; do not copy text from course pages.
- When a use case changes, update its scenarios in the same pull request.

## The data the scenarios need

A scenario creates its own people and postings in its `Given` steps, so it works on any database and
on every run. By hand, the quickest way to get them on a local in-memory database
(started without `app/backend/.env`, see [app/README.md](../../app/README.md)):

- **Applicants:** register a new one with an email nobody has used.
- **Recruiter and administrator:** the demo accounts Riley Chen and Avery Morgan (created by
  `config/DemoUsers.java`; emails and local passwords in the table in [app/README.md](../../app/README.md)).
- **Postings:** the sample postings in `app/backend/src/main/resources/data/jobs.csv` already include
  open ones (Backend Developer, Data Analyst Intern, Logistics Analyst and others), a closed one (QA
  Engineer), one pending approval (Product Designer) and a draft (Marketing Coordinator); a recruiter
  can submit more and the administrator approve them.

## Scenarios

| Scenario | Use case | Minimum scope |
| --- | --- | --- |
| [A visitor registers as an applicant and is logged in at once](applicant-1-register.md) | UC-02 Register as Applicant: main success scenario, steps 1–3 | Applicant 1 (register) |
| [A visitor who gives no last name and a weak password is refused on both, and nothing is saved](applicant-1-register-fields-wrong.md) | UC-02: extensions 2a and 2c | Applicant 1; the system validates input |
| [Registration is refused when an account already exists for the email](applicant-1-register-email-taken.md) | UC-02: extension 2b | Applicant 1; meaningful errors |
| [A visitor who wants a recruiter account is handed to recruiter and organization registration](applicant-1-register-recruiter-instead.md) | UC-02: extension 1a (continues in UC-08) | Applicant 1 |
| [An applicant logs in and gets an applicant session](applicant-2-log-in.md) | Log In: the user enters email and password, the system starts a session with the role | Applicant 2 (log in) |
| [A wrong password and an unknown email are refused alike](applicant-2-log-in-wrong-password.md) | Log In: an unknown email and a wrong password get the same answer | Applicant 2; meaningful errors |
| [Five failed log-ins lock the account, even against the right password](applicant-2-log-in-locked.md) | Log In: 5 failed attempts in 15 minutes lock the account for 15 minutes (A15) | Applicant 2; the system authenticates users |
| [An applicant cannot review job postings, which only an administrator does](applicant-2-log-in-other-roles-pages.md) | Log In: the role decides what the user can reach | Applicant 2; permissions follow the role |
| [An applicant's changed profile details are kept](applicant-3-view-and-update-profile.md) | UC-03 Update Applicant Profile: main success scenario, steps 1–4 | Applicant 3 (view and update own profile) |
| [An applicant's malformed phone number is refused and the saved profile is kept](applicant-3-update-profile-phone-wrong.md) | UC-03: extension 4a | Applicant 3; the system validates input |
| [A visitor finds the open postings that match a keyword](applicant-4-search-jobs.md) | UC-01 Search Job Postings: main success scenario, steps 1–2 | Applicant 4 (browse and search jobs) |
| [A search that matches nothing is told no posting matches](applicant-4-search-jobs-no-match.md) | UC-01: extension 2b | Applicant 4; meaningful errors |
| [A visitor views an open posting's details without logging in](applicant-5-view-job-details.md) | UC-01: step 2, the posting's details (shown on its page, UC-04 step 1) | Applicant 5 (view a job's details) |
| [An applicant with no resume puts one on file](applicant-7-upload-resume.md) | UC-03: steps 5–7 | Applicant 7 (the resume that goes with an application; UC-04 attaches a copy of it) |
| [A resume that is not a PDF or DOCX is refused and the current resume is kept](applicant-7-upload-resume-wrong-file.md) | UC-03: extension 6a | Applicant 7; the system validates input |
| [A recruiter logs in and reaches only the recruiter's work](recruiter-1-log-in.md) | Log In | Recruiter 1 (log in) |
| [The administrator logs in and reaches the posting approval queue](administrator-1-log-in.md) | Log In: starts a session with the Administrator role, which UC-12 requires (FR-UC12.1) | Administrator 1 (log in) |

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

The scenario of UC-02 extension 1a hands the visitor to recruiter registration, which works only once
UC-08 is on main; until then that page is a placeholder.
