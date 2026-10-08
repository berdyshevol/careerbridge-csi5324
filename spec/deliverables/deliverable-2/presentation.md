# CareerBridge — Iteration 1 Presentation (Deliverable 2)

> **Slides as submitted**, converted from `CareerBridge_Iteration_1_Presentation.pdf` (21 slides,
> submitted to Canvas Sep 28, 2026; presented in class Sep 29). Text is taken from the PDF;
> diagrams drawn on the slides are described in words.
> Documentation: [deliverable-2.md](deliverable-2.md) · task: [assignment.md](assignment.md).
>
> The slides say "UC-16 Extend Job Offer" in four places (slides 2, 18, 19, 20). The documentation
> numbers that use case **UC-15**. The text below keeps the slides' wording.

## Slide 1 — Title

Baylor University · CSI 5324 Software Engineering

**CareerBridge** — Iteration 1: use cases, requirements and the draft domain model.
Recruiting and Application Management System.

Zeba Tusnia Towshi · Rabeya Nazara · Josh Job Joseph · Reagan Rubio · Oleg Berdyshev

## Slide 2 — Agenda: who covers what

| # | Part | Speaker |
|---|---|---|
| 1 | Overview and rules | Josh Job Joseph |
| 2 | Find, join, apply | Oleg · UC-01 to UC-03 · Josh · UC-04 |
| 3 | The applicant's journey | Rabeya Nazara · UC-05 to UC-07 |
| 4 | Onboarding recruiters | Reagan Rubio · UC-08 to UC-10 |
| 5 | Life of a job posting | Zeba Tusnia Towshi · UC-11 to UC-13 |
| 6 | Hiring and the model | Josh Job Joseph · UC-14, UC-16 |

## Slide 3 — Project scope: many organizations, one job board (Josh Job Joseph)

- **15** user-goal use cases, fully dressed
- **2** subfunctions: Log In, Close Job Posting
- **15** business rules traced to D0 answers
- **18** working assumptions for the customer to confirm

**Actors.** Human: Visitor, Applicant, Recruiter, Administrator. «system»: Notification Service,
Scheduler.

**In this deliverable**

- Use-case diagram and fully dressed use cases
- Functional and non-functional requirements
- System sequence diagrams and operation contracts
- Traceability and consistency checks

## Slide 4 — Business rules: one fixed pipeline for every application (Josh Job Joseph)

**Active — counts toward the 5-application limit (BR-4):**
Applied → Screening → Interview → Offer → Hired

**Terminal — frees a slot:**

| State | Who, from where |
|---|---|
| Withdrawn | Applicant, from Applied, Screening or Interview (UC-06) |
| Rejected | Recruiter, from any active stage, reason shared (UC-14) |
| Offer Declined | Applicant, at the Offer stage (UC-07) |

| Rule | Title | Text |
|---|---|---|
| BR-9 | Approved before published | An administrator reviews every posting before the public can see it. |
| BR-10 | Closes on its own | A posting closes at its deadline or when every opening is filled. |
| BR-15 | Organizations stay separate | Recruiters see only applications to their own organization's postings. |

## Slide 5 — Section 01: Find, join, apply

UC-01 Browse · UC-02 Register · UC-03 Profile and Resume · UC-04 Apply for Job.
Oleg Berdyshev, then Josh Job Joseph for UC-04.

## Slide 6 — UC-01 to UC-03: browse freely, register to apply (Oleg Berdyshev)

| | UC-01 Browse Job Postings (Visitor) | UC-02 Register as Applicant (Visitor) | UC-03 Maintain Profile and Resume (Applicant) |
|---|---|---|---|
| 1 | Public pages, no login needed (BR-3) | Self-registration, no admin approval (BR-14) | Exactly one resume on file (BR-6) |
| 2 | Search by keyword, location, organization and employment type | Email verification link valid for 24 hours | PDF or DOCX up to 5 MB, scanned for malware |
| 3 | Only open postings, newest first | Passwords: 10+ characters with a letter and a number | Replaces the old resume in one step |
| Edge case | The posting closes while the list is open: the visitor is told it no longer accepts applications. | The verification link expired: the visitor can ask for a new one (7a). | Resume replaced after applying: copies already sent with applications stay unchanged (A6). |

## Slide 7 — UC-01 to UC-03: extensions that keep things safe (Oleg Berdyshev)

| Extension | Situation | What the system does |
|---|---|---|
| UC-01 6c | A recruiter or administrator tries to apply | Explains that only Applicant accounts can apply |
| UC-02 4b | The email is already registered | Offers Log In or a password reset; no new account |
| UC-02 7b | The visitor never verifies the email | Deletes the unverified account after 7 days (A15) |
| UC-03 5a | A resume is already on file | Warns that the new file replaces it (BR-6) |
| UC-03 5b | The applicant deletes the resume | Warns they can't apply without one; sent copies stay (A6) |
| UC-03 6b | The malware scan flags the file | Rejects it, keeps the current resume, logs it for the admin |

**Quality targets**

- **2 s** — search results, up to 10,000 open postings
- **10 s** — to upload and scan a 5 MB resume
- **AA** — WCAG 2.1 on desktop and mobile
- **24 h** — verification link; passwords unreadable, even by staff

## Slide 8 — UC-04 Apply for Job: one click, strict checks (Josh Job Joseph)

**Main success scenario**

| Steps | Name | What happens |
|---|---|---|
| 1–2 | Review | Posting, contact details, resume on file and "3 of 5 active" |
| 3 | Confirm | Acknowledges a submitted application can't be edited (BR-5) |
| 4 | System checks | Posting still open, under 5 active (BR-4), never applied here (A5) |
| 5–7 | Applied | Resume copy kept (A6), confirmation sent, "4 of 5 active" |

**When it doesn't go smoothly**

| Extension | Title | Text |
|---|---|---|
| 2a · No resume | Sent to UC-03 first | A resume is required (BR-6); after uploading, the applicant returns to step 2. |
| 2b · 4b · At the limit | Blocked at 5 active | Lists the active applications. Holds even if two submissions arrive at once. |
| 4c · Already applied | No second try | Shows the existing application's stage, even if it was withdrawn (A5). |

## Slide 9 — Section 02: The applicant's journey

UC-05 Track Application Status · UC-06 Withdraw Application · UC-07 Respond to Job Offer.
Rabeya Nazara.

## Slide 10 — UC-05 to UC-07: track, then withdraw or respond (Rabeya Nazara)

| | UC-05 Track Application Status | UC-06 Withdraw Application | UC-07 Respond to Job Offer |
|---|---|---|---|
| 1 | Every stage with its date (BR-7) | Only in Applied, Screening or Interview | Accept → Hired; Decline → Offer Declined |
| 2 | Interview details, but never outcomes (A12) | Final; no reapplying to that posting (A5) | Revised terms are shown before any response |
| 3 | Rejection reason shown (BR-11) | Frees a slot: "2 of 5 active" | Past the deadline: can't be accepted (A14) |
| Edge case | Someone else's application: "not found," and the attempt is logged | Moved to Offer meanwhile: sent to UC-07 to decline instead | Last opening filled: Close Job Posting extends it (BR-10, A2) |

## Slide 11 — UC-05 to UC-07: rules that must hold under pressure (Rabeya Nazara)

- **1 min** for a stage change to reach the applicant. Applicants see every stage, but never a
  recruiter's internal notes or interview outcomes. (NFR-UC05.3, NFR-UC05.4)
- **100%** of withdrawals leave stage and count in step. Even one interrupted by a failure: the
  stage and the active-application count always agree. (NFR-UC06.1)
- **0** hires beyond a posting's openings. Holds even when two applicants accept the last opening
  at the same moment. (NFR-UC07.1, FR-UC07.10)

**System operations · SSD-05 to SSD-07**

- `viewApplications()`
- `viewApplication(applicationId)`
- `viewOffer(applicationId)`
- `requestWithdrawal(applicationId)`
- `withdrawApplication(applicationId, reason)`
- `acceptOffer(applicationId)`
- `declineOffer(applicationId, reason)`

## Slide 12 — Section 03: Onboarding recruiters

UC-08 Register Recruiter and Organization · UC-09 Join Additional Organization · UC-10 Approve
Request. Reagan Rubio.

## Slide 13 — UC-08 to UC-10: nobody recruits without approval (Reagan Rubio)

Flow drawn on the slide: two entry points lead to the administrator's approval queue, which ends
in one of two outcomes.

| Step | Who | Text |
|---|---|---|
| UC-08 · New recruiter | Visitor | Enters personal and organization details, then verifies a work email. Creates a pending account + organization. |
| UC-09 · Existing recruiter | Recruiter | Asks to join another organization with a role and a short justification. Creates a pending membership. |
| UC-10 · Approval queue | Administrator | Oldest first, with flags such as an email domain that doesn't match the organization's website. |
| Approved | — | Access granted: account, new organization and membership become Active. |
| Denied | — | Recorded with reason: the requester is told why. The decision goes to the audit log. |

Until approved, a pending recruiter sees only the status of the request (BR-14).

## Slide 14 — UC-08 to UC-10: genuine organizations, separate data (Reagan Rubio)

| Reference | Title | Points |
|---|---|---|
| FR-UC08.3 | No duplicate organizations | Matched on normalized legal name and website domain. A match becomes a membership request instead. |
| UC-08 ext. 4d · A17 | Suspicious requests get flagged | Work email domain differs from the organization's website. The request goes through, flagged for closer review. |
| BR-15 · A16 · NFR-UC09.1 | One organization at a time | Recruiters switch between approved organizations. Each view shows only that organization's data. |

**System operations · SSD-08 to SSD-10**

- `submitRecruiterRegistration(recruiterData, organizationData)`
- `verifyEmail(token)`
- `submitMembershipRequest(organizationId, role, justification)`
- `approveRequest(requestId)`

## Slide 15 — Section 04: Life of a job posting

UC-11 Create Job Posting · UC-12 Approve Job Posting · UC-13 Expire Job Posting.
Zeba Tusnia Towshi.

## Slide 16 — UC-11 to UC-13: every posting follows the same path (Zeba Tusnia Towshi)

State diagram drawn on the slide:

| From | Event | To |
|---|---|---|
| Draft | submit · UC-11 | Pending Approval |
| Pending Approval | approve · UC-12 | Published (visible in UC-01) |
| Pending Approval | return, with admin comments | Returned |
| Returned | resubmit | Pending Approval |
| Pending Approval | reject · UC-12 | Rejected (final) |
| Published | deadline · UC-13 | Closed (Expired) |
| Published | last opening filled · UC-07 | Closed (Filled) |
| Draft, Pending Approval, Returned | deadline passes before publication · UC-13 | Expired (never published) |

**Closing.** Expired: submitted applications keep moving through the pipeline. Filled: remaining
applications are rejected with "Posting closed" (A3).

## Slide 17 — UC-11 to UC-13: three operations, three contracts (Zeba Tusnia Towshi)

| Operation | Preconditions | Postconditions |
|---|---|---|
| `submitJobPosting(organizationId, postingData)` | Approved recruiter with an active membership in that organization; required fields entered. | JobPosting created in Pending Approval, linked to the organization and recruiter, queued for review, not public. |
| `approveJobPosting(postingId)` | Administrator; posting is Pending Approval; deadline not passed; organization and recruiter active. | Published with date and approving administrator, audit entry written, recruiters' notice queued. |
| `runExpirationJob()` | The Scheduler is running; the job starts at least every 15 minutes. | Overdue Published postings Closed as Expired; overdue unpublished ones marked Expired; the run is logged. |

- **1–90 days** — allowed deadline window
- **1 business day** — target for an approval decision
- **1,000 postings** — closed within 1 minute
- **23:59** — deadline, in the organization's time zone

## Slide 18 — Section 05: From screening to offer

UC-14 Screen Applications · UC-16 Extend Job Offer, plus the domain model. Josh Job Joseph.

## Slide 19 — UC-14 · UC-16: screen, then offer (Josh Job Joseph)

| | UC-14 Screen Applications (Recruiter) | UC-16 Extend Job Offer (Recruiter) |
|---|---|---|
| 1 | One stage forward at a time, never back (BR-8, A8) | Only from the Interview stage (BR-8) |
| 2 | Sees the resume copy sent with that application, never others (BR-15, A6) | Start date, compensation, terms and a response deadline |
| 3 | Records interviews arranged outside the system, at most two rounds; outcomes stay internal (BR-12, A13) | Deadline defaults to 7 days; the start date must come after it (A14) |
| 4 | Rejects at any active stage, with a reason that is always shared (BR-11) | An unanswered offer can be revised; the applicant sees the new terms (A14) |
| Edge case | Skip or reverse a stage: only the next stage is allowed (5b). | Offers already cover every opening: warns before sending (2b). |

## Slide 20 — Domain model: the domain model behind it all (Reagan Rubio; the slide prints "Regan")

Classes and attributes shown on the slide (a reduced version of Figure 25 in the documentation):

| Class | Attributes shown |
|---|---|
| User | userId, email, accountStatus |
| Applicant, Recruiter, Administrator | (kinds of User) |
| Notification | type, message, status |
| Resume | fileName, fileType, uploadDate |
| Org. Membership | status, requestedAt, approvedAt |
| Organization | name, organizationStatus, website |
| Job Posting | title, postStatus, approvalStatus, applicationDeadline |
| Application | applicationStatus, resumeSnapshot, statusHistory |
| Offer | salary, expirationDate, status |
| Interview | scheduledTime, outcome, notes |

Associations shown: User 1 — * Notification · Applicant 1 — 1 Resume · Recruiter 1 — * Org.
Membership · Org. Membership * — 1 Organization · Organization 1 — * Job Posting · Job Posting
1 — * Application · Application 1 — 0..1 Offer · Application 1 — * Interview.

**Why it fits**

- Membership lets one recruiter join several organizations (BR-2).
- resumeSnapshot keeps the resume as submitted (A6).
- statusHistory lets applicants see every stage (BR-7).
- 0..1 Offer, * Interviews per application (UC-14, UC-16).

## Slide 21 — Thank you

Questions and discussion welcome. Team CareerBridge · CSI 5324 · Recruiting and Application
Management System · Iteration 1.
