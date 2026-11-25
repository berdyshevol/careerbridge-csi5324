# User scenarios

Acceptance scenarios for UC-01 Search Job Postings, UC-02 Register as Applicant, UC-03 Update
Applicant Profile and Log In, written in Gherkin (`.feature` files) and run as end-to-end tests with
[playwright-bdd](https://github.com/vitalets/playwright-bdd). Every scenario comes from a use case in
[use-cases.md](../use-cases.md), its main success scenario or one of its extensions, and names the item
of the course's minimum scope for the final iteration that it shows. The owner of another use case adds
its scenarios the same way.

The style follows Dave Farley's acceptance tests: a scenario says **what** the system does, in the words
of the use case, never **how** a screen does it, so it stays true when the screens change.

## Run them

```bash
cd app/frontend
npm run test:e2e                                          # with all end-to-end tests
npx bddgen && npx playwright test --project=scenarios     # only the scenarios
npx bddgen && npx playwright test --project=scenarios --grep @UC-02          # one use case
npx bddgen && npx playwright test --project=scenarios --grep @scope-applicant-1   # one minimum-scope item
```

`bddgen` turns the `.feature` files into Playwright tests in `app/frontend/.features-gen/` (not committed).
They run in their own Playwright project, `scenarios`, at laptop width only, against a backend on a fresh
database, like the other end-to-end tests. A scenario passes when every `Then` holds. Each one can also be walked by hand on the running app.

## How it is built

Three layers, as in Farley's model:

| Layer | Where | Knows |
| --- | --- | --- |
| Scenarios | `spec/user-scenarios/*.feature` | The use cases' language only |
| DSL: the step definitions, the scenarios' vocabulary | [app/frontend/e2e/scenarios/dsl.ts](../../app/frontend/e2e/scenarios/dsl.ts) | What each step means, in calls to the driver |
| Driver | [app/frontend/e2e/scenarios/driver.ts](../../app/frontend/e2e/scenarios/driver.ts) | The screens, their wording and the backend's addresses |

The DSL only calls the driver; they hold no addresses, labels or wording. When a screen changes
its wording, only the driver changes. When a use case changes, its scenarios change, and the steps only
if new words are needed.

**Isolation.** Every scenario creates its own people and postings in its `Given` steps. The driver gives
each alias ("Sam", "Cloud Developer") this run's suffix, so scenarios never meet each other's data and
can run in parallel and again on the same database. Two exceptions, because the system cannot create
these roles yet: `a recruiter "Riley" with an active account` is the demo recruiter Riley Chen, and
`the administrator` is the demo administrator Avery Morgan (`config/DemoUsers.java`).

## How a scenario is written

One scenario per file. Copy an existing one, such as
[applicant-1-register-email-taken.feature](applicant-1-register-email-taken.feature).

```gherkin
# UC-02 extension 2b; minimum scope Applicant 1, meaningful errors
@UC-02 @extension-2b @scope-applicant-1 @meaningful-errors
Feature: UC-02 Register as Applicant

  Scenario: Registration is refused when an account already exists for the email
    Given an applicant "Sam" is registered
    When a visitor registers as an applicant with the email address of "Sam"
    Then the registration is refused because an account already exists for that email
    ...
```

- **File name:** `role-n-what.feature` for a use case's main success scenario and `role-n-what-outcome.feature`
  for one of its extensions. The role is `applicant`, `recruiter` or `administrator`, and `n` is the number
  of the minimum-scope item it shows. Lower case, words joined by hyphens.
- **First line:** a comment with the use case's steps or extension and the minimum-scope item.
- **Tags:** the use case (`@UC-02`, `@Log-In`), the steps (`@main-success-scenario`, `@extension-2b`), the
  item (`@scope-applicant-1`), and any system-wide requirement shown (`@validation`, `@meaningful-errors`,
  `@permissions`, `@authentication`).
- **Feature:** the use case's number and name. **Scenario:** the outcome, as a sentence.
- **Steps:** domain language only, what a person achieves and what the system decides. No buttons, fields,
  page titles, addresses or exact messages: those belong in the driver.
  - Names are always in quotes (`"Sam"`), so one step definition serves every scenario.
  - Reuse a step from `dsl.ts` before writing a new one; a new step is one line there that calls the driver.
  - `Given` creates the data; each `Then` is an outcome the use case requires, including what must not
    happen ("no account exists for ..."). One scenario, one outcome.
- Write the wording yourself; do not copy text from course pages.
- When a use case or a screen changes, update its scenarios, steps or driver in the same pull request.

## Scenarios

| Scenario | Use case and minimum scope |
| --- | --- |
| [A visitor registers as an applicant and is logged in at once](applicant-1-register.feature) | UC-02 main success scenario, steps 1-3; minimum scope Applicant 1 |
| [A registration with no last name and a weak password is refused on both, and nothing is saved](applicant-1-register-fields-wrong.feature) | UC-02 extensions 2a and 2c; minimum scope Applicant 1, input validation |
| [Registration is refused when an account already exists for the email](applicant-1-register-email-taken.feature) | UC-02 extension 2b; minimum scope Applicant 1, meaningful errors |
| [A visitor who wants a recruiter account is handed to recruiter and organization registration](applicant-1-register-recruiter-instead.feature) | UC-02 extension 1a, which continues in UC-08; minimum scope Applicant 1 |
| [An applicant logs in and gets an applicant session](applicant-2-log-in.feature) | Log In; minimum scope Applicant 2 |
| [A wrong password and an unknown email are refused alike](applicant-2-log-in-wrong-password.feature) | Log In: an unknown email and a wrong password get the same answer; minimum scope Applicant 2, meaningful errors |
| [Five failed log-ins lock the account, even against the right password](applicant-2-log-in-locked.feature) | Log In: five failed attempts in 15 minutes lock the account for 15 minutes (A15); minimum scope Applicant 2 |
| [An applicant cannot review job postings, which only an administrator does](applicant-2-log-in-other-roles-pages.feature) | Log In: the role decides what the user can reach; minimum scope Applicant 2, permissions by role |
| [An applicant's changed profile details are kept](applicant-3-view-and-update-profile.feature) | UC-03 main success scenario, steps 1-4; minimum scope Applicant 3 |
| [A malformed phone number is refused and the saved profile is kept](applicant-3-update-profile-phone-wrong.feature) | UC-03 extension 4a; minimum scope Applicant 3, input validation |
| [A visitor finds the open postings that match a keyword](applicant-4-search-jobs.feature) | UC-01 main success scenario, steps 1-2; minimum scope Applicant 4 |
| [A search that matches nothing says no posting matches](applicant-4-search-jobs-no-match.feature) | UC-01 extension 2b; minimum scope Applicant 4, meaningful errors |
| [A visitor views an open posting's details without logging in](applicant-5-view-job-details.feature) | UC-01 step 2, the details of a posting, shown on its own page (UC-04 step 1); minimum scope Applicant 5 |
| [An applicant with no resume puts one on file](applicant-7-upload-resume.feature) | UC-03 steps 5-7; minimum scope Applicant 7 (UC-04 sends a copy of this resume with each application) |
| [A resume that is not a PDF or DOCX is refused and the current resume is kept](applicant-7-upload-resume-wrong-file.feature) | UC-03 extension 6a; minimum scope Applicant 7, input validation |
| [A recruiter logs in and reaches only the recruiter's work](recruiter-1-log-in.feature) | Log In; minimum scope Recruiter 1 |
| [The administrator logs in and reaches the posting approval queue](administrator-1-log-in.feature) | Log In: a session with the Administrator role, which UC-12 requires (FR-UC12.1); minimum scope Administrator 1 |

## Coverage

**Minimum scope.** Of the items that belong to these use cases, every one has a scenario: Applicant 1
(register), 2 (log in), 3 (view and update own profile), 4 (browse and search jobs), 5 (view a job's
details) and 7 (the resume that goes with an application, uploaded in UC-03), Recruiter 1 and
Administrator 1 (log in). The system-wide requirements shown are input validation, meaningful errors,
authentication and permissions by role. Applicant 6, 8 and 9 and the other recruiter and administrator
items belong to UC-04 to UC-15.

**Use cases.** Every main success scenario has a scenario, and so does every extension a scenario can set
up on its own, except:

| Use case | Not covered | Why |
| --- | --- | --- |
| UC-01 | 2a: no posting is open at all | Other postings are always open on a shared database. |
| UC-01 | A closed posting is not returned | A scenario cannot close a posting yet: only the deadline does (UC-13). |
| UC-01, UC-02, UC-03 | \*a: the system fails | Needs the backend to fail in the middle of a request. |
| UC-01 | No applicant or application data on public pages (special requirement) | A check that something is absent from a page proves little; left to review. |
| Log In | A recruiter in Pending Approval sees only the request's status | Needs UC-08, not on main yet. |

The UC-02 extension 1a scenario checks that the visitor is handed to recruiter registration; that page
does the registration only once UC-08 is on main.
