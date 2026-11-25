# CareerBridge — Testing

> Part of the CareerBridge specification — see the [index](README.md).

## 9. Testing

How the implemented use cases are tested, and the test cases themselves.

### 9.1 JUnit Testing Summary

Not written yet. What the JUnit tests cover per layer (entities, services, controllers), how many
there are and how they run (on PostgreSQL in Docker, in CI on every pull request), plus the frontend
tests (Vitest) and the end-to-end tests (Playwright).

### 9.2 Test Cases

At least one test case per implemented feature, in the template's columns; the Actual Result is
left empty until the case has run. Each member writes and runs the cases of their own use cases.

**UC-11 to UC-13 (TC-11-…, TC-12-…, TC-13-…).** Written by Zeba Tusnia Towshi from the use cases
and their extensions. AI assistance: Claude Code (Anthropic) drafted the cases and matched each to
the automated JUnit test that checks it; Zeba Tusnia Towshi reviewed them. Each case was run through
its JUnit test on November 25, 2026 (`./mvnw test` in `app/backend`); the Actual Result names that
test. A case for a design that is not built yet is listed with the status Not run, so the gap shows.

| Test Case ID | Assigned Tester | Scenario/Condition | Test Inputs | Expected Result | Actual Result | Test Status |
| --- | --- | --- | --- | --- | --- | --- |
| TC-11-01 | Zeba Tusnia Towshi | UC-11 ext. 3b: a recruiter saves a valid posting | Existing organization, title "Data Analyst", deadline in 30 days, 1 opening | Posting saved as Draft, linked to the organization | As expected (`JobPostingServiceTest.createPostingSavesDraftWithCorrectOrganization`) | Pass |
| TC-11-02 | Zeba Tusnia Towshi | UC-11 ext. 5a: the title is missing | Blank title, other fields valid | Refused with 400 "Job title is required"; nothing saved | As expected (`JobPostingServiceTest.createPostingRejectsBlankTitle`) | Pass |
| TC-11-03 | Zeba Tusnia Towshi | UC-11 ext. 5b: the deadline is in the past | Deadline yesterday | Refused with the deadline's reason; nothing saved | As expected (`JobPostingServiceTest.createPostingRejectsPastDeadline`) | Pass |
| TC-11-04 | Zeba Tusnia Towshi | UC-11 ext. 5a: the organization does not exist | Unknown organization id | Refused with 400 "Organization not found" | As expected (`JobPostingServiceTest.createPostingRejectsUnknownOrganization`) | Pass |
| TC-11-05 | Zeba Tusnia Towshi | UC-11 ext. 5a: a field is longer than its column | Location of 256 characters | Refused with a reason naming the field | As expected (`JobPostingServiceTest.createPostingRejectsTextTooLongForItsColumn`) | Pass |
| TC-11-06 | Zeba Tusnia Towshi | FR-UC11.6: a Draft is not public | A new Draft, then a public search | The Draft is not in the search results | As expected (`JobPostingServiceTest.newlyCreatedDraftIsHiddenFromPublicSearch`) | Pass |
| TC-11-07 | Zeba Tusnia Towshi | UC-11 steps 4–6: a Draft is submitted | Draft with a deadline 30 days away | Status Pending Approval; in the approval queue | As expected (`JobPostingApprovalTest.draftCanBeSubmittedForApproval`) | Pass |
| TC-11-08 | Zeba Tusnia Towshi | UC-11 ext. 5b: deadline outside 1 to 90 days at submission | Drafts with deadlines today, 91 days and 90 days away | Today and 91 days refused with the allowed range; 90 days submitted | As expected (`JobPostingApprovalTest.deadlineMustBeBetweenOneAndNinetyDaysAway`) | Pass |
| TC-11-09 | Zeba Tusnia Towshi | UC-11 ext. 6a: a Returned posting is resubmitted | Returned posting with the Administrator's comment | Pending Approval again; the previous decision and comment cleared | As expected (`JobPostingApprovalTest.returnedPostingCanBeResubmitted`, `resubmittingClearsPreviousReviewInformation`) | Pass |
| TC-11-10 | Zeba Tusnia Towshi | UC-12 ext. 5b: a Rejected posting cannot be resubmitted | Rejected posting | Refused with 409 naming its status | As expected (`JobPostingApprovalTest.rejectedPostingCannotBeResubmitted`) | Pass |
| TC-11-11 | Zeba Tusnia Towshi | UC-11 ext. \*a: the recruiter is not an Active member of the organization (SD-4, SD-5) | Recruiter without an Active membership in the chosen organization | Refused with 403; nothing saved | Not run: the membership check is designed, not built (needs Organization Membership, UC-08 to UC-10) | Not run |
| TC-11-12 | Zeba Tusnia Towshi | CO-11.1: a new posting records its recruiter | Logged-in recruiter riley.chen@example.com creates a valid posting | The saved posting is linked to that recruiter; an account that is not a recruiter is refused with 403 | As expected (`JobPostingServiceTest.createPostingLinksTheRecruiterWhoCreatedIt`, `createPostingRefusesAnAccountThatIsNotARecruiter`) | Pass |
| TC-11-13 | Zeba Tusnia Towshi | CO-11.1: another recruiter submits the posting | Draft created by Riley Chen, submitted as other@example.com; a sample posting with no recruiter | Refused with 403 and the reason; the posting stays Draft | As expected (`JobPostingApprovalTest.anotherRecruiterCannotSubmitThePosting`, `aPostingNoRecruiterCreatedCannotBeSubmitted`; `JobPostingControllerTest.anotherRecruitersPostingIsForbiddenWithItsReason`) | Pass |
| TC-11-14 | Zeba Tusnia Towshi | UC-11 ext. 3b: the recruiter reopens and changes their draft | Draft by Riley Chen; new title, location Remote, 3 openings | Saved; still a Draft of the same organization | As expected (`JobPostingApprovalTest.aDraftIsReopenedAndChangedByItsRecruiter`) | Pass |
| TC-11-15 | Zeba Tusnia Towshi | UC-11 ext. 6a: a Returned posting is revised and submitted again | Returned posting with the comment "Add the salary range" | The comment shows while editing and stays after saving; submitting makes it Pending Approval and clears the comment | As expected (`JobPostingApprovalTest.aReturnedPostingKeepsItsCommentUntilItIsSubmittedAgain`; `JobPostingControllerTest.reopeningAPostingSendsTheAdministratorsComment`) | Pass |
| TC-11-16 | Zeba Tusnia Towshi | CO-11.2: another recruiter opens or changes the posting | Draft by Riley Chen, opened and changed as other@example.com | Both refused with 403; the posting is unchanged | As expected (`JobPostingApprovalTest.anotherRecruiterCannotOpenOrChangeThePosting`) | Pass |
| TC-11-17 | Zeba Tusnia Towshi | CO-11.2: the posting is no longer a Draft or Returned | A Published posting opened; a Pending Approval posting changed | Both refused with 409 naming the status | As expected (`JobPostingApprovalTest.onlyADraftOrAReturnedPostingCanBeChanged`) | Pass |
| TC-11-18 | Zeba Tusnia Towshi | UC-11 ext. 5a: an invalid change | Draft changed to a blank title | Refused with 400 "Job title is required"; the title is unchanged | As expected (`JobPostingApprovalTest.anInvalidChangeIsRefusedAndNothingChanges`) | Pass |
| TC-11-19 | Zeba Tusnia Towshi | UC-11 ext. 3b and 6a through the screens | Riley Chen creates a draft, edits it, submits it; the administrator returns it with a comment; Riley revises and submits it again | Each step shows on screen; the revised posting is in the approval queue | As expected (`e2e/edit-job-posting.spec.ts`, laptop and phone) | Pass |
| TC-12-01 | Zeba Tusnia Towshi | UC-12 steps 1–2: the queue | One Draft, one Published and two Pending Approval postings | Only the two pending postings, oldest first | As expected (`JobPostingApprovalTest.pendingListIsOldestFirst`, `pendingListExcludesDraftsAndPublishedPostings`) | Pass |
| TC-12-02 | Zeba Tusnia Towshi | Special requirement: only an Administrator opens the queue | Request without a session, as a Recruiter, as an Administrator | 401, 403, then 200 | As expected (`AdminJobPostingControllerTest.theQueueNeedsAnAdministrator`) | Pass |
| TC-12-03 | Zeba Tusnia Towshi | UC-12 steps 5–6: the Administrator approves | Pending posting with a deadline 30 days away | Published, publication date and deciding Administrator recorded, in public search | As expected (`JobPostingApprovalTest.pendingPostingCanBeApproved`, `approvedPostingAppearsInPublicSearch`, `approvalRecordsThePublicationDate`; `AdminJobPostingControllerTest.approvalRecordsTheSignedInAdministrator`) | Pass |
| TC-12-04 | Zeba Tusnia Towshi | UC-12 ext. 6a: the deadline passed while pending | Pending posting whose deadline is over | Returned with a request for a new deadline; not published | As expected (`JobPostingApprovalTest.pastDeadlineReturnsThePostingForANewDeadline`) | Pass |
| TC-12-05 | Zeba Tusnia Towshi | UC-12 ext. 5a: return for changes | Pending posting, comment "Please clarify the job requirements" | Returned with the comment | As expected (`JobPostingApprovalTest.pendingPostingCanBeReturnedForCorrections`) | Pass |
| TC-12-06 | Zeba Tusnia Towshi | UC-12 ext. 5b: reject without a reason | Pending posting, empty comment | Refused with 400 and the reason; stays pending | As expected (`JobPostingApprovalTest.rejectionRequiresAReason`; `AdminJobPostingControllerTest.aRejectionWithoutAReasonIsABadRequestWithItsReason`) | Pass |
| TC-12-07 | Zeba Tusnia Towshi | UC-12 ext. 6c: the posting was already decided | Published posting, approved again | Refused with 409 naming the current status | As expected (`JobPostingApprovalTest.publishedPostingCannotBeApprovedAgain`; `AdminJobPostingControllerTest.aPostingAlreadyDecidedIsAConflictThatNamesItsStatus`) | Pass |
| TC-12-08 | Zeba Tusnia Towshi | UC-12 ext. 6b: the organization or submitting recruiter is no longer active (SD-7) | Pending posting of an inactive organization | Refused with 409; the posting stays pending | Not run: designed, not built (needs Organization Membership, UC-08 to UC-10) | Not run |
| TC-13-01 | Zeba Tusnia Towshi | UC-13 step 3: a Published posting passes its deadline | Published posting, deadline yesterday | Closed with reason Expired and the time it closed | As expected (`JobPostingExpirationServiceTest.closesOverduePublishedPosting`) | Pass |
| TC-13-02 | Zeba Tusnia Towshi | UC-13 ext. 2b: a posting never published passes its deadline | Pending Approval and Returned postings, deadline yesterday | Both Expired, not published | As expected (`JobPostingExpirationServiceTest.expiresPendingApprovalPosting`, `expiresReturnedPosting`) | Pass |
| TC-13-03 | Zeba Tusnia Towshi | UC-13 step 2: the deadline has not passed | Published posting, deadline tomorrow | Unchanged | As expected (`JobPostingExpirationServiceTest.doesNotExpirePostingBeforeDeadline`) | Pass |
| TC-13-04 | Zeba Tusnia Towshi | UC-13 ext. 3a, NFR-UC13.1: already closed, and a second run | A Closed posting; a Published posting with the job run twice | Nothing closed again | As expected (`JobPostingExpirationServiceTest.leavesAlreadyClosedPostingUnchanged`, `runningTwiceDoesNotCloseAgain`) | Pass |
| TC-13-05 | Zeba Tusnia Towshi | UC-13 ext. 3b, NFR-UC13.3: one posting fails | Two overdue Published postings; saving the first fails | The second is still closed; the run reports 1 closed | As expected (`JobPostingExpirationServiceTest.failureInOnePostingDoesNotStopRemainingPostings`) | Pass |
| TC-13-06 | Zeba Tusnia Towshi | NFR-UC13.5: the deadline in the organization's time zone | Organization in UTC+14, its deadline's last minute | Closed only after 23:59 there | As expected (`JobPostingExpirationServiceTest.reachesAPostingInTheEarliestTimeZoneInItsLastMinute`) | Pass |
| TC-13-07 | Zeba Tusnia Towshi | UC-13 ext. \*a, FR-UC13.9: the recruiter closes their Published posting | Published posting created by Riley Chen, deadline in 10 days, closed by Riley Chen | Closed with reason Closed by recruiter and the time; gone from public search | As expected (`JobPostingApprovalTest.theRecruiterClosesTheirPublishedPosting`; `JobPostingControllerTest.closingPassesTheLoggedInRecruiterAndAnswersWithThePosting`) | Pass |
| TC-13-08 | Zeba Tusnia Towshi | A3: closing keeps applications and refuses new ones | Jordan Lee applied, then the posting is closed; Sam Rivera applies after | Jordan's application stays Applied; Sam's is refused | As expected (`JobPostingApprovalTest.closingKeepsTheApplicationsAndRefusesNewOnes`) | Pass |
| TC-13-09 | Zeba Tusnia Towshi | CO-13.2: another recruiter closes the posting | Published posting of Riley Chen, closed as other@example.com | Refused with 403; stays Published | As expected (`JobPostingApprovalTest.anotherRecruiterCannotCloseThePosting`) | Pass |
| TC-13-10 | Zeba Tusnia Towshi | CO-13.2: the posting is not Published | A Draft; a posting closed a moment earlier | Both refused with 409 naming the status; the Draft stays Draft | As expected (`JobPostingApprovalTest.onlyAPublishedPostingCanBeClosed`; `JobPostingControllerTest.closingAPostingThatIsNotPublishedIsAConflictWithItsReason`) | Pass |
| TC-13-11 | Zeba Tusnia Towshi | CO-13.2: the deadline has already passed | Published posting whose deadline was 2 days ago | Refused with 409; stays Published for the expiration job to close as Expired | As expected (`JobPostingApprovalTest.aPostingPastItsDeadlineIsLeftToExpire`) | Pass |
| TC-13-12 | Zeba Tusnia Towshi | Special requirement: only a Recruiter closes a posting | Close without a session, as an Applicant, as an Administrator | 401, 403, 403 | As expected (`AccessByRoleTest.onlyARecruiterCreatesAPosting`) | Pass |
