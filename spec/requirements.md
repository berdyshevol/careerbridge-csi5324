# CareerBridge — Requirements

> Part of the CareerBridge specification — see the [index](README.md). Section numbers are those of the project documentation, so references such as "section 4.3" work across files.

## 3. Requirements

The requirements below come from the use cases in section 4.2. Each functional requirement cites the use-case steps or extensions it realizes, and section 3.4 traces every one to the SSD message and operation contract that carry it out. Business rules (BR-n) come from the customer's answers in section 3.3; assumptions (A-n) are listed in section 2.2.

### 3.1 Functional Requirements

#### UC-01 Browse Job Postings

- **FR-UC01.1:** The system shall let any visitor, without logging in, view the open job postings of all organizations, newest first. (BR-1, BR-3, BR-9, BR-10; UC-01 steps 1–2)

- **FR-UC01.2:** The system shall let a visitor search open postings by keyword, location, organization and employment type. (UC-01 steps 3–4)

- **FR-UC01.3:** The system shall show the full details of a selected open posting. (UC-01 steps 5–6)

#### UC-02 Register as Applicant

- **FR-UC02.1:** The system shall let a visitor create an Applicant account with full name, email address and password, without Administrator approval. (BR-14; UC-02 steps 1–5)

- **FR-UC02.2:** The system shall reject a registration with a missing field, a malformed or already registered email address, or a password shorter than 10 characters or lacking a letter or a number. (A15; UC-02 step 4, extensions 4a–4c)

- **FR-UC02.3:** The system shall email the new Applicant a verification link valid for 24 hours and activate the account only when the link is opened before it expires. (A15; UC-02 steps 5–8, extension 7a)

#### UC-03 Maintain Profile and Resume

- **FR-UC03.1:** The system shall let an applicant view their profile details and edit their full name, phone, location, headline, skills, education and work experience, and shall reject the changes if the full name is empty or the phone number is malformed. (UC-03 steps 1–4, extension 4a)

- **FR-UC03.2:** The system shall let an applicant upload one resume, a PDF or DOCX file of up to 5 MB, that replaces any previous resume, and shall reject any other file or a file flagged by the malware scan. (BR-6; UC-03 steps 5–7, extensions 6a, 6b)

- **FR-UC03.3:** The system shall keep the resume copy attached to each submitted application unchanged when the applicant replaces their resume. (BR-5, A6; UC-03 step 6, Success Guarantee)

#### UC-04 Apply for Job

- **FR-UC04.1:** The system shall let a logged-in Applicant apply to an open posting and, before submission, show the posting title and organization, the Applicant's contact details, the resume on file and how many of the 5 active applications are in use. (BR-4; UC-04 steps 1–2)

- **FR-UC04.2:** The system shall require the Applicant to confirm the submission and to acknowledge that a submitted application cannot be edited; if the Applicant cancels, nothing shall be saved. (BR-5; UC-04 step 3, extension 3b)

- **FR-UC04.3:** Before creating an application, the system shall verify that the posting is still open, that the Applicant has fewer than 5 active applications and that the Applicant has not applied to the posting before, including through a withdrawn application. (BR-4, BR-10, A5; UC-04 step 4, extensions 4a–4c)

- **FR-UC04.4:** The system shall create the application in the Applied stage, keep a copy of the resume as it was at submission and record the submission time. (A6; UC-04 step 5)

- **FR-UC04.5:** After creating the application, the system shall ask the Notification Service to send the Applicant a confirmation, and shall confirm the submission with the updated count of active applications and a link to Track Application Status (UC-05). (UC-04 steps 6–7)

- **FR-UC04.6:** If the Applicant has no resume on file, the system shall explain that a resume is required and send the Applicant to Maintain Profile and Resume (UC-03), then resume the application. (BR-6; UC-04 extension 2a)

- **FR-UC04.7:** If the Applicant already has 5 active applications, the system shall block the application, list the active applications and explain that a slot frees up when one is withdrawn or reaches Hired, Rejected or Offer Declined. (BR-4, A7; UC-04 extensions 2b, 4b)

- **FR-UC04.8:** If the Notification Service is unavailable, the system shall keep the application saved, retry the confirmation and still confirm the submission on screen. (UC-04 extension 6a)

#### UC-14 Screen Applications

- **FR-UC14.1:** The system shall present every posting of the organization the Recruiter is acting for, each with the number of applications at each stage. (A10; UC-14 steps 1–2)

- **FR-UC14.2:** The system shall present an application's resume copy, the applicant's profile details and the application's stage history, and nothing about the applicant's other applications. (A6, BR-15; UC14 steps 3–4)

- **FR-UC14.3:** The system shall let the Recruiter add an optional internal note and advance an application only to the next stage of the fixed pipeline, and shall record the new stage, the date and the Recruiter. (BR-8; UC-14 steps 5–6)

- **FR-UC14.4:** After an advance, the system shall ask the Notification Service to notify the applicant of the new stage within the time A11 allows. (BR-7, A11; UC-14 step 7)

- **FR-UC14.5:** The system shall refuse any move that skips or reverses a stage and explain that the pipeline is fixed and stage changes are final. (BR-8, A8; UC-14 extension 5b)

- **FR-UC14.6:** The system shall let the Recruiter reject an application at any active stage with a reason from the fixed list and an optional comment, warning first that a rejection at the Offer stage rescinds the offer. It shall record the stage, reason, date and Recruiter, and ask the Notification Service to send the applicant the reason within the time A11 allows for that stage. (BR-11, A8, A18; UC-14 extension 5a)

- **FR-UC14.7:** At the Interview stage, the system shall let the Recruiter record up to two interview rounds with their date and time, format, location or meeting link and interviewers, and later each round's outcome and notes. For a newly arranged interview it shall ask the Notification Service to send the applicant the details. (BR-12, A13; UC-14 extension 5c)

- **FR-UC14.8:** The system shall let the Recruiter advance several applications together and report any it could not move. (UC-14 extension 5d)

- **FR-UC14.9:** When a Recruiter asks for a posting or application of an organization they are not an Active member of, the system shall reveal nothing, report that it was not found and record the attempt. (BR-15; UC-14 extension *a)

- **FR-UC14.10:** If the application was withdrawn, rejected or moved by another recruiter since the Recruiter took it up, the system shall report the current stage and change nothing. (UC-14 extension 6a)

- **FR-UC14.11:** The system shall let a Recruiter who belongs to several organizations switch the organization they act for, and then present only that organization's postings. (BR-2, A16; UC-14 extension 2a)

#### UC-15 Extend Job Offer

- **FR-UC15.1:** The system shall let a Recruiter extend an offer only on an application at the Interview stage, and shall present the offer terms to fill in, with the job title taken from the posting and the posting's openings, accepted offers and outstanding offers. (BR-8; UC-15 steps 1–2, extension 1a)

- **FR-UC15.2:** The system shall collect the start date, compensation, other terms and response deadline, with the deadline defaulting to 7 days, and shall accept an optional offer letter as a PDF of at most 5 MB. (A14; UC-15 step 3, Special Requirements)

- **FR-UC15.3:** The system shall show the offer as the applicant will see it and require the Recruiter to confirm it; if the Recruiter cancels, nothing shall change. (UC-15 step 4, extension 4a)

- **FR-UC15.4:** The system shall reject an offer with a missing or invalid field, a response deadline that is not in the future, or a start date that is not after the response deadline. (A14; UC-15 step 5, extension 5a)

- **FR-UC15.5:** When the offer is valid, the system shall move the application to the Offer stage and record the terms, the date and the Recruiter. (BR-8, BR-13; UC-15 step 6)

- **FR-UC15.6:** The system shall ask the Notification Service to send the applicant the offer with a link to Respond to Job Offer (UC-07), and confirm to the Recruiter that it was sent. (UC-15 steps 7–8)

- **FR-UC15.7:** The system shall let a Recruiter revise an unanswered offer's terms, response deadline or offer letter, keep the application in the Offer stage, record the revision with the date and the Recruiter, and tell the applicant what changed. (A14; UC-15 extension 1b)

- **FR-UC15.8:** The system shall warn the Recruiter when no interview with the outcome Passed is recorded, and when the posting's accepted plus outstanding offers already equal its openings, and shall let the Recruiter continue or cancel. (A2, A3; UC-15 extensions 2a, 2b)

- **FR-UC15.9:** If, since the Recruiter started, the application was withdrawn or rejected, the applicant answered the offer, or the posting was filled, the system shall report the current status and shall not make or revise the offer. (UC-15 extension 5b)

- **FR-UC15.10:** When a Recruiter asks for an application of an organization they are not an Active member of, the system shall reveal nothing, report that it was not found and record the attempt. (BR15; UC-15 extension *a)

#### UC-05 Track Application Status

- **FR-UC05.1:** The system shall let a logged-in Applicant view all applications that belong to that Applicant, with active applications shown first. Each application shall show the posting title, organization, submission date, current stage, and date of the most recent stage change. (BR-7, BR-15; UC-05 steps 1–2)

- **FR-UC05.2:** The system shall let an Applicant select one of their applications and view its stage history, including each pipeline stage reached and the date on which the application entered that stage. (BR-7, BR-8; UC-05 steps 3–4)

- **FR-UC05.3:** The system shall display the date, time, format and location of any recorded interview for the selected application, and shall not display interview outcomes. (BR-12, A12; UC-05 step 4)

- **FR-UC05.4:** The system shall display the rejection date, stage at rejection, and recorded rejection reason when an application is in the Rejected stage. (BR-11; UC-05 extension 4a)

- **FR-UC05.5:** The system shall show only the actions that are valid for the application's current stage. For applications in Applied, Screening, or Interview, the system shall provide the Withdraw action through UC-06. For an application in Offer, the system shall provide the Accept and Decline actions through UC-07. (BR-5, BR-13; UC-05 step 5, extensions 5a–5b)

- **FR-UC05.6:** When an Applicant asks for an application that is not theirs, the system shall reveal nothing about it, report that it was not found and record the attempt. (BR-15; UC-05 extension *a)

- **FR-UC05.7:** The system shall let an Applicant filter the application list to show active or terminal applications. (UC-05 extension 2b)

- **FR-UC05.8:** The system shall show the Applicant's current number of active applications relative to the maximum of five allowed active applications. (BR-4; UC-05 step 2)

#### UC-06 Withdraw Application

- **FR-UC06.1:** The system shall let an Applicant withdraw an application only while it is in the Applied, Screening, or Interview stage. An application in the Offer stage shall be handled through UC-07 instead. (BR-5, BR-8; UC-06 Preconditions)

- **FR-UC06.2:** Before recording a withdrawal, the system shall show the posting title, organization, current application stage, and a warning that the withdrawal is final and that the Applicant cannot reapply to the posting under the current assumption. (A5; UC-06 steps 1–2)

- **FR-UC06.3:** The system shall allow the Applicant to provide an optional withdrawal reason and shall require the Applicant to confirm the withdrawal before any application data is changed. (UC-06 step 3)

- **FR-UC06.4:** Before completing a withdrawal, the system shall verify that the application is still in an eligible active stage. If the application has already moved to Offer or a terminal stage, the system shall not withdraw it. (BR-8; UC-06 step 4, extensions 4a–4b)

- **FR-UC06.5:** After a successful withdrawal, the system shall change the application stage to Withdrawn and record the withdrawal date and any reason provided by the Applicant. (UC-06 step 5)

- **FR-UC06.6:** After a successful withdrawal, the application shall no longer count toward the Applicant's 5 active applications. (BR-4, A7; UC-06 Success Guarantee)

- **FR-UC06.7:** After a successful withdrawal, the system shall ask the Notification Service to notify the posting organization's recruiters and send a confirmation to the Applicant. (UC-06 step 6)

- **FR-UC06.8:** If the Notification Service is unavailable, the system shall keep the withdrawal recorded, queue the notifications, and retry delivery later. (UC-06 extension 6a)

- **FR-UC06.9:** A withdrawn application shall remain stored as a read-only record for audit purposes and shall not be deleted by the withdrawal operation. (UC-06 Special Requirements)

#### UC-07 Respond to Job Offer

- **FR-UC07.1:** The system shall let an Applicant whose application is in the Offer stage view the offer details, including the organization, job title, start date, compensation, other offer terms, and response deadline. (BR-13; UC-07 steps 1–2)

- **FR-UC07.2:** The system shall allow the Applicant to either Accept or Decline an active offer. (BR13; UC-07 step 3, extension 3a)

- **FR-UC07.3:** The system shall require confirmation before recording either acceptance or decline of an offer, and no change shall be made if the Applicant leaves or does not confirm. (UC-07 steps 4–5; extensions 3a, 3b, 5a)

- **FR-UC07.4:** When an Applicant confirms acceptance, the system shall move the application to Hired and record the acceptance date. (BR-13; UC-07 step 6)

- **FR-UC07.5:** When an Applicant confirms a decline, the system shall move the application to Offer Declined and record the date and any reason given. The application shall then no longer count toward the Applicant's 5 active applications. (BR-4, BR-13, A7; UC-07 extension 3a, Success Guarantee)

- **FR-UC07.6:** Before recording an offer response, the system shall verify that the offer is still open. If the application has been rejected, the posting has closed, or the response deadline has passed, the system shall show the current stage and make no change. (UC-07 extension 6a)

- **FR-UC07.7:** When an acceptance makes the posting's accepted offers equal its openings, the system shall close the posting with the reason Filled, remove it from public listings, stop accepting applications, reject every remaining active application with the reason "Posting closed" and notify those applicants. (BR-10, BR-11, A2, A3; UC-07 extension 6c)

- **FR-UC07.8:** After an offer response is successfully recorded, the system shall ask the Notification Service to notify the posting organization's recruiters and send a confirmation to the Applicant. (UC07 steps 7–8)

- **FR-UC07.9:** If the Notification Service is unavailable, the system shall keep the Applicant's decision recorded, queue the notifications, and retry delivery later. (UC-07 extension 7a)

- **FR-UC07.10:** The system shall prevent the number of accepted offers for a posting from exceeding the posting's number of openings, including when multiple Applicants accept offers at nearly the same time. (A2; UC-07 Special Requirements)

- **FR-UC07.11:** If the recruiter revised the offer after the Applicant viewed it, the system shall present the revised terms and record no response until the Applicant responds to them. (A14; UC-07 extension 6b)

#### UC-08 Register Recruiter and Organization

- **FR-UC08.1:** The system shall check that all required registration fields are present and valid and that the password meets the policy before creating the recruiter account. (UC-08 step 4, extension 4a)

- **FR-UC08.2:** The system shall reject a registration whose email address is already registered, offer Log In instead and create no account. (UC-08 step 4, extension 4b)

- **FR-UC08.3:** The system shall determine whether an organization already exists by comparing its normalized legal name and website domain against registered organizations. (UC-08 step 4, extension 4c; Technology and Data Variations 4a)

- **FR-UC08.4:** When the visitor opens a valid verification link, the system shall mark the email verified, add the request to the Administrator's approval queue and ask the Notification Service to alert the Administrator. (UC-08 steps 6–7)

#### UC-09 Join Additional Organization

- **FR-UC09.1:** Before creating a membership request, the system shall verify that the recruiter is not already a member of the organization and has no pending request for it. (UC-09 step 6, extensions 6a– 6b)

- **FR-UC09.2:** The system shall prevent the recruiter from accessing the target organization's postings and applications until the membership request is approved. (BR-15; UC-09 Success Guarantee)

- **FR-UC09.3:** When a recruiter creates a new organization through UC-09, the system shall create the organization with a Pending Approval status. (UC-09 extension 3a)

#### UC-10 Approve Recruiter/Organization Request

- **FR-UC10.1:** The system shall allow only authenticated users with the **Administrator** role to access the recruiter/organization approval queue. (UC-10 Preconditions, Special Requirements)

- **FR-UC10.2:** When the Administrator approves a request, the system shall activate the recruiter account if new, the organization if new, and the membership, and record the decision. (UC-10 step 6)

- **FR-UC10.3:** The system shall ask the Notification Service to tell the requester the decision, with the reason when the request is denied. (UC-10 step 7, extension 5a)

#### UC-11 Create Job Posting

- **FR-UC11.1:** The system shall allow an approved Recruiter to create a job posting only for an organization in which the Recruiter has an active membership. (BR-14; UC-11 Preconditions, extension 2a)

- **FR-UC11.2:** The system shall collect and validate the posting title, description, requirements, location, employment type, application deadline, and number of openings before submission. (UC-11 steps 3 and 5, extension 5a)

- **FR-UC11.3:** The system shall allow an optional salary range and shall require the number of openings to be at least one. (UC-11 steps 3 and 5)

- **FR-UC11.4:** The system shall require the application deadline to be between 1 and 90 days from submission. (UC-11 step 5, extension 5b)

- **FR-UC11.5:** The system shall save a submitted posting with Pending Approval status, link it to its organization and creating Recruiter, and add it to the Administrator's posting approval queue. (UC-11 step 6)

- **FR-UC11.6:** The system shall keep Draft and Pending Approval postings hidden from public listings. (BR-9; UC-11 Success Guarantee)

- **FR-UC11.7:** The system shall allow a Recruiter to save a posting as Draft without submitting it for approval. (UC-11 extension 3b)

- **FR-UC11.8:** The system shall show a Returned posting with the Administrator's comments and let a recruiter of the organization revise and resubmit it. (UC-11 extension 6a; UC-12 extension 5a)

#### UC-12 Approve Job Posting

- **FR-UC12.1:** The system shall allow only authenticated Administrators to access the job-posting approval queue. (UC-12 Preconditions)

- **FR-UC12.2:** The system shall list Pending Approval postings oldest first and display the title, organization, submitting Recruiter, submission date, and application deadline. (UC-12 step 2)

- **FR-UC12.3:** The system shall provide a public-view preview of a selected posting and the owning organization's current account status. (UC-12 step 4)

- **FR-UC12.4:** When an Administrator approves a valid posting, the system shall set its status to Published, record the publication date and deciding Administrator, and add it to public listings. (UC12 step 6)

- **FR-UC12.5:** The system shall allow an Administrator to return a posting for changes only after comments are entered. (UC-12 extension 5a)

- **FR-UC12.6:** The system shall allow an Administrator to reject a posting with a reason and prevent that rejected posting from being resubmitted. (UC-12 extension 5b)

- **FR-UC12.7:** If the deadline has passed, the system shall block approval and return the posting to the recruiters for a new deadline. If the organization or submitting Recruiter is no longer active, it shall block publication, show the reason and keep the posting pending. (UC-12 extensions 6a, 6b)

- **FR-UC12.8:** The system shall notify the organization's recruiters after an approval, return, or rejection decision. (UC-12 step 7; extensions 5a, 5b)

#### UC-13 Expire Job Posting

- **FR-UC13.1:** The system shall run the expiration process at least every 15 minutes. (UC-13 step 1, Special Requirements)

- **FR-UC13.2:** The system shall identify every Published job posting whose application deadline has passed. (UC-13 step 2)

- **FR-UC13.3:** The system shall close each overdue Published posting with reason Expired, remove it from public listings, and prevent new applications. (UC-13 step 3)

- **FR-UC13.4:** The system shall preserve the stages of applications submitted before the posting deadline. (A3; UC-13 Success Guarantee)

- **FR-UC13.5:** The system shall mark a Pending Approval or Returned posting whose deadline has passed as Expired, without publishing it, and notify its recruiters that a new deadline is needed. (UC13 extension 2b)

- **FR-UC13.6:** The system shall skip a posting that was already closed, including one closed because all openings were filled. (UC-13 extension 3a)

- **FR-UC13.7:** The system shall notify the owning organization's recruiters when a posting expires and include the number of still-active applications. (UC-13 step 4)

- **FR-UC13.8:** The system shall log each expiration run, including start time, postings closed, and errors. (UC-13 step 5)

### 3.2 Non-functional Requirements

#### UC-01 Browse Job Postings

- **NFR-UC01.1 (Performance):** Search results appear within 2 seconds for up to 10,000 open postings.

- **NFR-UC01.2 (Usability):** Pages work on current desktop and mobile browsers and meet WCAG 2.1 AA.

#### UC-02 Register as Applicant

- **NFR-UC02.1 (Security):** Passwords are stored only as salted hashes, and all traffic uses HTTPS.

- **NFR-UC02.2 (Performance):** The system hands the verification email to the Notification Service within 1 minute of registration. (A11)

- **NFR-UC02.3 (Usability):** Pages work on current desktop and mobile browsers and meet WCAG 2.1 AA.

#### UC-03 Maintain Profile and Resume

- **NFR-UC03.1 (Performance):** The system validates, scans and stores a 5 MB resume within 10 seconds after receiving it.

- **NFR-UC03.2 (Security/Privacy):** Resume files are encrypted at rest. Only the applicant and the Administrator can open the resume on file; a recruiter sees only the resume copy attached to an application to their organization's posting. (BR-15, A6)

#### UC-04 Apply for Job

- **NFR-UC04.1 (Integrity):** An Applicant shall never have more than 5 active applications, even when several submissions from the same Applicant arrive at the same moment. (BR-4; UC-04 Special Requirements)

- **NFR-UC04.2 (Integrity):** If a failure interrupts a submission, either the application exists with its resume copy or nothing was created, in 100% of cases. (UC-04 extension *a)

- **NFR-UC04.3 (Performance):** The Applicant's confirmation shall be sent within 1 minute of submission. (A11; UC-04 Special Requirements)

- **NFR-UC04.4 (Privacy):** An application shall be visible only to the Applicant, the Administrator and the posting's recruiters. (BR-15, A10; UC-04 Success Guarantee)

- **NFR-UC04.5 (Reliability):** If the Notification Service is unavailable, no submitted application shall be lost, and every held notice is sent within 15 minutes after the service is available again.

#### UC-14 Screen Applications

- **NFR-UC14.1 (Performance):** The applications to a posting with up to 1,000 applications shall be listed within 2 seconds. (UC-14 Special Requirements)

- **NFR-UC14.2 (Freshness):** A new stage shall be visible to the applicant in UC-05 within 1 minute of the change. (UC-14 Special Requirements)

- **NFR-UC14.3 (Privacy):** No applicant view and no other organization's view shall show an internal note or an interview outcome. (A12; UC-14 Special Requirements)

- **NFR-UC14.4 (Auditability):** 100% of stage changes, rejections and interview records shall be logged with the Recruiter and the date and time. (UC-14 Special Requirements)

- **NFR-UC14.5 (Reliability):** If the Notification Service is unavailable, no recorded stage change shall be lost, and every held notice shall still be sent within the time A11 allows for its stage. (UC-14 extension 7a)

#### UC-15 Extend Job Offer

- **NFR-UC15.1 (Performance):** The offer shall be sent to the applicant within 1 minute of the Recruiter's confirmation. (A11; UC-15 Special Requirements)

- **NFR-UC15.2 (Privacy):** Offer terms shall be visible only to the applicant, the posting's recruiters and the Administrator. (BR-15, A10; UC-15 Special Requirements)

- **NFR-UC15.3 (Auditability):** 100% of offers and revisions shall be logged with the Recruiter and the date and time. (UC-15 Special Requirements)

- **NFR-UC15.4 (Reliability):** If the Notification Service is unavailable, no recorded offer or revision shall be lost, and every held notice is sent within 15 minutes after the service is available again.

#### UC-05 Track Application Status

- **NFR-UC05.1 (Performance):** The application-status page shall load within 2 seconds for an Applicant with up to 200 applications.

- **NFR-UC05.2 (Security/Privacy):** An Applicant shall be able to access only applications that belong to that Applicant. Attempts to access another Applicant's application shall reveal no application data and shall be logged.

- **NFR-UC05.3 (Freshness):** A stage change made by a recruiter shall appear to the Applicant within 1 minute.

- **NFR-UC05.4 (Privacy):** No applicant view shall show a recruiter's internal notes or an interview outcome (A12).

#### UC-06 Withdraw Application

- **NFR-UC06.1 (Integrity):** After any withdrawal attempt, including one interrupted by a failure, the application's stage and the Applicant's count of active applications shall agree in 100% of cases. (UC06 extension *a, Special Requirements)

- **NFR-UC06.2 (Performance):** A successful withdrawal shall become visible to the posting organization's recruiters within 1 minute.

- **NFR-UC06.3 (Reliability):** If the Notification Service is unavailable, no recorded withdrawal shall be lost, and every held notice is sent within 15 minutes after the service is available again.

#### UC-07 Respond to Job Offer

- **NFR-UC07.1 (Integrity):** A posting shall never have more Hired applications than openings, even when two or more Applicants accept the last opening at the same moment. (A2; UC-07 Special Requirements)

- **NFR-UC07.2 (Performance):** A filled posting shall leave public listings within 1 minute of the acceptance that filled it. (UC-07 Special Requirements)

- **NFR-UC07.3 (Reliability):** If the Notification Service is unavailable, no recorded offer response shall be lost, and every held notice is sent within 15 minutes after the service is available again.

#### UC-08 Register Recruiter and Organization

- **NFR-UC08.1 (Performance):** A verified registration request shall appear in the Administrator's approval queue within 1 minute of email verification. (UC-08 Special Requirements)

#### UC-09 Join Additional Organization

- **NFR-UC09.1 (Security):** A recruiter shall only be able to access data belonging to organizations for which the recruiter has an approved membership.

- **NFR-UC09.2 (Integrity):** At most one pending membership request shall exist per recruiter and organization, even when two identical requests are submitted at the same moment.

#### UC-10 Approve Recruiter/Organization Request

- **NFR-UC10.1 (Auditability):** 100% of approval decisions shall be logged with the deciding Administrator, the date and time, the decision and any reason. (UC-10 Special Requirements)

- **NFR-UC10.2 (Integrity):** After any approval, including one interrupted by a failure, the recruiter account, any new organization and the membership shall be either all Active or all unchanged.

#### UC-11 Create Job Posting

- **NFR-UC11.1 (Security):** Draft and pending postings shall be visible only to approved recruiters of the owning organization and Administrators.

- **NFR-UC11.2 (Reliability):** After a session timeout, a recruiter who logs in again within 24 hours shall recover all posting-form input entered up to 30 seconds before the timeout. (UC-11 Special Requirements)

#### UC-12 Approve Job Posting

- **NFR-UC12.1 (Security):** Only users with the Administrator role shall be authorized to approve, return, or reject job postings.

- **NFR-UC12.2 (Auditability):** Every posting decision shall record the deciding Administrator, date/time, decision, and any comments or reason.

- **NFR-UC12.3 (Reliability):** If the Notification Service is unavailable, no recorded posting decision shall be lost, and every held notice is sent within 15 minutes after the service is available again.

#### UC-13 Expire Job Posting

- **NFR-UC13.1 (Reliability/Idempotency):** Running the expiration job more than once shall not close an already closed posting again.

- **NFR-UC13.2 (Performance):** A run that closes up to 1,000 overdue postings shall finish within 1 minute.

- **NFR-UC13.3 (Reliability):** Failure to close one posting shall not stop the remaining postings from being processed; the failed posting shall be retried on the next run.

- **NFR-UC13.4 (Reliability):** If the Notification Service is unavailable, no recorded posting closure shall be lost, and every held notice is sent within 15 minutes after the service is available again.

- **NFR-UC13.5 (Correctness):** A posting shall stop accepting applications at 23:59 on its deadline date in the organization's time zone, and shall leave public listings no more than 15 minutes later (one run interval).

### 3.3 Requirements Clarifications

Table 2 lists the 14 clarification questions submitted in Deliverable 0, the customer's answers, the business rule each answer became and the use cases that enforce it. The customer has not changed any answer since Deliverable 0.

**Table 2: Deliverable 0 clarification questions, answers and resulting business rules**

|**Q**|**Question**|**Customer answer**|**Business rule**|**Enforced in**|
|---|---|---|---|---|
|1|Is the system for a single<br>organization's internal recruiting, or a<br>multi-company job board where<br>many organizations post jobs?|Multi-organization,<br>similar to LinkedIn.|BR-1: Many organizations post<br>jobs; applicants browse and apply<br>across organizations.|UC-01|
|2|Can one recruiter belong to multiple<br>organizations?|Yes.|BR-2: A recruiter may belong to<br>more than one organization.|UC-09, UC-11,<br>UC-14|
|3|Should the public (not-logged-in<br>visitors) be able to browse job<br>postings, or is everything behind a<br>login?|Some pages are public.|BR-3: Some pages are public:<br>visitors can browse open postings<br>without logging in.|UC-01, UC-12|
|4|Can an applicant apply to multiple<br>jobs at once? Is there a limit on|Yes, 5 active<br>applications.|BR-4: An applicant may have at<br>most 5 active applications at a time.|UC-04 to UC-<br>07, UC-13,|
||active applications?|||UC-14, Close<br>Job Posting|
|5|Can an applicant withdraw or edit an<br>application after submitting it?|They can withdraw but<br>not edit it.|BR-5: An applicant may withdraw a<br>submitted application but may not<br>edit it.|UC-03 to UC-<br>06|
|6|One resume per applicant, or<br>multiple resumes or cover letters<br>tailored per application?|One resume.|BR-6: Each applicant has exactly<br>one resume on file; no cover letters<br>or per-job resumes.|UC-03, UC-04|
|7|What should an applicant see about<br>their application status: every<br>internal stage, or only coarse<br>outcomes?|All stages.|BR-7: Applicants see every pipeline<br>stage of their own applications.|UC-05, UC-14|
|8|What are the stages of the recruiting<br>pipeline? Is the pipeline fixed or<br>configurable per job?|Fixed pipeline.|BR-8: The recruiting pipeline is<br>fixed for all postings (see diagram<br>below).|UC-05, UC-06,<br>UC-14, UC-15|
|9|Do job postings need an approval<br>step before going live, and do they<br>expire (deadline, auto-close when<br>filled)?|Yes, and they do expire.|BR-9: A job posting must be<br>approved before it is published.<br>BR-10: A posting closes<br>automatically when its deadline<br>passes or when it is filled (A2<br>defines filled).|UC-01, UC-04,<br>UC-05, UC-07,<br>UC-11 to UC-<br>13, Close Job<br>Posting|
|10|Should rejected applicants be<br>notified automatically? Are rejection<br>reasons recorded and/or shared?|Yes and yes.|BR-11: Rejected applicants are<br>notified automatically, and the<br>recorded rejection reason is shared<br>with them.|UC-05, UC-07,<br>UC-14, Close<br>Job Posting|
|11|Should interview coordination<br>happen inside the system, or is it<br>enough to record that an interview<br>was scheduled and its outcome?|It is enough to record<br>that an interview was<br>scheduled.|BR-12: The system records that an<br>interview was scheduled and its<br>outcome; it does not coordinate<br>times.|UC-05, UC-14|
|12|Is an offer extended and accepted or<br>declined through the system, and<br>should a job posting close<br>automatically once it is filled?|Yes; the posting should<br>close automatically to<br>save memory and time<br>for other applications.|BR-10: A posting closes<br>automatically when its deadline<br>passes or when it is filled (A2<br>defines filled).<br>BR-13: Offers are extended,<br>accepted and declined inside the<br>system.|UC-01, UC-04,<br>UC-05, UC-07,<br>UC-13, UC-15,<br>Close Job<br>Posting|
|13|Who creates and approves new<br>recruiter and organization accounts?<br>Is applicant self-registration open?|Applicants can self-<br>register. Recruiter and<br>organization accounts<br>require Administrator<br>approval.|BR-14: Applicants self-register;<br>recruiter and organization accounts<br>require Administrator approval.|UC-02, UC-08,<br>UC-10, UC-11,<br>UC-14, UC-15,<br>Log In|
|14|Are there privacy expectations<br>(company A cannot see applications<br>to company B; recruiters cannot see<br>an applicant's other applications)?|Yes. Recruiters only<br>access applications to<br>jobs within their own<br>organization and cannot<br>view an applicant's<br>applications to other<br>organizations.|BR-15: Recruiters see only<br>applications to their own<br>organizations' postings, never an<br>applicant's applications elsewhere.|UC-01, UC-03<br>to UC-05, UC-<br>09 to UC-11,<br>UC-14, UC-15,<br>Log In|

Writing the use cases raised further questions for the customer. Table 3 lists them with the use case that raised each one and the answer the team works with until the customer replies.

**Table 3: Open questions raised by the use cases, with the team's working answers**

|**Use case**|**Question for the customer**|**Team's working answer**|
|---|---|---|
|UC-04|Confirm that an applicant cannot reapply to a posting after<br>withdrawing.|As stated in A5 (section 2.2).|
|UC-04|Should recruiters also get a notice for each new application, or<br>only see new applications among their postings?|This model only lists them (UC-14).|
|UC-04|Confirm that an application at the Offer stage counts toward the<br>limit until the offer is accepted, declined or expires.|As stated in A7 (section 2.2).|
|UC-14|Confirm that every active recruiter of an organization sees all of<br>its postings and applications.|As stated in A10 (section 2.2).|
|UC-14|Confirm the notice times: a rejection before the Interview stage<br>by the end of the business day; an advance, or a rejection at the<br>Interview or Offer stage, within 4 business days.|As stated in A11 (section 2.2).|
|UC-14|Confirm that an application can never be moved back a stage and<br>that a rejection is final.|As stated in A8 (section 2.2).|
|UC-14|Confirm that interview outcomes stay hidden from applicants and<br>that an application has at most two interview rounds.|As stated in A12, A13 (section 2.2).|
|UC-15|Is 7 days a sensible default response deadline?|As stated in A14 (section 2.2).|
|UC-15|Should an interview with the outcome Passed be required before<br>an offer, rather than only warned about?|This model only warns.|
|UC-15|A14: may a revision shorten the response deadline, or only<br>extend it?|This model allows any future deadline.|
|UC-05|BR-7 says applicants see all stages. Confirm that this means<br>stage names and dates only, not recruiter notes or recruiter<br>names; this model shows names and dates only.|Not covered by the current use cases; left for<br>the customer to decide.|
|UC-05|Should rejection reasons come from a fixed list with an optional<br>comment, to keep them professional, or be free text?|This model uses a fixed list (A18).|
|UC-05|Confirm that applications to a filled posting are rejected with the<br>reason "Posting closed."|As stated in A3 (section 2.2).|
|UC-06|Confirm that an applicant cannot reapply after withdrawing.|As stated in A5 (section 2.2).|
|UC-06|Is the withdrawal reason shared with the recruiter, or kept for<br>platform statistics only?|This model shares it.|
|UC-06|Should an applicant be able to withdraw at the Offer stage?|This model routes that case to Decline in<br>UC-07.|
|UC-07|Once hired, should the applicant's other active applications be<br>withdrawn automatically?|This model leaves them to the applicant.|
|UC-07|Confirm the number-of-openings rule and the automatic rejection<br>with the reason "Posting closed."|As stated in A2 and A3 (section 2.2).|
|UC-07|Confirm that an offer past its response deadline can no longer be<br>accepted and stays in Offer until a recruiter rejects it.|As stated in A14 (section 2.2).|
|UC-08|What evidence should the Administrator require to approve a<br>request (matching email domain, business registration number)?|Not covered by the current use cases; left for<br>the customer to decide.|
|UC-08|When a new recruiter asks to join an existing organization,<br>should an approved recruiter of that organization approve instead<br>of the Administrator?|As stated in A4 (section 2.2).|
|UC-08|Should a pending recruiter be able to draft postings before<br>approval?|This model says no.|
|UC-09|Should the Administrator approve membership requests, or an|As stated in A4 (section 2.2).|
||existing recruiter of the target organization?||
|UC-09|Is there a limit on how many organizations one recruiter can<br>join?|Not covered by the current use cases; left for<br>the customer to decide.|
|UC-09|Leaving an organization, or being removed from one, is not<br>covered by any current use case.|Not covered by the current use cases; left for<br>the customer to decide.|
|UC-10|What verification criteria must be met before approval? This ties<br>to UC-08.|Not covered by the current use cases; left for<br>the customer to decide.|
|UC-10|Confirm that the Administrator, not the organization, approves<br>membership requests.|As stated in A4 (section 2.2).|
|UC-10|Suspending or revoking an approved recruiter or organization is<br>not covered by any current use case.|Not covered by the current use cases; left for<br>the customer to decide.|
|UC-11|Confirm that the Administrator, not a reviewer inside the<br>organization, approves postings.|As stated in A1 (section 2.2).|
|UC-11|Can a published posting be edited, and does an edit need re-<br>approval? Can the deadline be extended?|Not covered by the current use cases; left for<br>the customer to decide.|
|UC-11|Is the 90-day maximum deadline acceptable, and is salary range<br>required?|Not covered by the current use cases; left for<br>the customer to decide.|
|UC-11|Can every recruiter of an organization manage all of its postings,<br>or only their own?|Not covered by the current use cases; left for<br>the customer to decide.|
|UC-12|Confirm that the Administrator approves postings.|As stated in A1 (section 2.2).|
|UC-12|Who writes the posting guidelines, and what do they prohibit?|Not covered by the current use cases; left for<br>the customer to decide.|
|UC-12|Should organizations with a good track record be allowed to<br>publish without review?|Not covered by the current use cases; left for<br>the customer to decide.|
|UC-13|Confirm that applications submitted before the deadline continue<br>after the posting expires.|As stated in A3 (section 2.2).|
|UC-13|Can a recruiter reopen an expired posting with a new deadline,<br>and would that need re-approval?|Not covered by the current use cases; left for<br>the customer to decide.|
|UC-13|Applications never processed after expiry keep occupying<br>applicants' slots (BR-4). Should they be rejected automatically<br>after some period?|Not covered by the current use cases; left for<br>the customer to decide.|

### 3.4 Traceability Matrix

Table 4 traces each functional requirement to the use-case steps it cites, the SSD message that carries it out and that message's operation contract (section 4.3). Query messages change nothing, so they have no contract. "None" marks an extension that has no system operation in its SSD, and so no contract.

**Table 4: Functional requirements to use-case steps, SSD messages and operation contracts**

|**FR**|**Use-case steps**|**SSD message**|**Operation contract**|
|---|---|---|---|
|FR-UC01.1|UC-01 steps 1–2|searchPostings(criteria)|CO-01.1|
|FR-UC01.2|UC-01 steps 3–4|searchPostings(criteria)|CO-01.1|
|FR-UC01.3|UC-01 steps 5–6|viewPosting(postingId)|CO-01.2|
|FR-UC02.1|UC-02 steps 1–5|register(fullName, email, password)|CO-02.1|
|FR-UC02.2|UC-02 step 4, extensions 4a–4c|register(fullName, email, password)|CO-02.1|
|FR-UC02.3|UC-02 steps 5–8, extension 7a|register(fullName, email, password),<br>verifyEmail(token)|CO-02.1, CO-02.2|
|FR-UC03.1|UC-03 steps 1–4, extension 4a|viewProfile(), updateProfile(details)|CO-03.1, CO-03.2|
|FR-UC03.2|UC-03 steps 5–7, extensions 6a, 6b|uploadResume(file)|CO-03.3|
|FR-UC03.3|UC-03 step 6, Success Guarantee|uploadResume(file)|CO-03.3|
|FR-UC04.1|UC-04 steps 1–2|startApplication(postingId)|query (no contract)|
|FR-UC04.2|UC-04 step 3, extension 3b|submitApplication(postingId)|CO-04.1|
|FR-UC04.3|UC-04 step 4, extensions 4a–4c|submitApplication(postingId)|CO-04.1|
|FR-UC04.4|UC-04 step 5|submitApplication(postingId)|CO-04.1|
|FR-UC04.5|UC-04 steps 6–7|submitApplication(postingId)|CO-04.1|
|FR-UC04.6|UC-04 extension 2a|startApplication(postingId)|query (no contract)|
|FR-UC04.7|UC-04 extensions 2b, 4b|startApplication(postingId),<br>submitApplication(postingId)|query (no contract), CO-04.1|
|FR-UC04.8|UC-04 extension 6a|submitApplication(postingId)|CO-04.1|
|FR-UC05.1|UC-05 steps 1–2|viewApplications()|CO-05.1|
|FR-UC05.2|UC-05 steps 3–4|viewApplication(applicationId)|CO-05.2|
|FR-UC05.3|UC-05 step 4|viewApplication(applicationId)|CO-05.2|
|FR-UC05.4|UC-05 extension 4a|viewApplication(applicationId)|CO-05.2|
|FR-UC05.5|UC-05 step 5, extensions 5a–5b|viewApplication(applicationId)|CO-05.2|
|FR-UC05.6|UC-05 extension *a|viewApplication(applicationId)|CO-05.2|
|FR-UC05.7|UC-05 extension 2b|viewApplications()|CO-05.1|
|FR-UC05.8|UC-05 step 2|viewApplications()|CO-05.1|
|FR-UC06.1|UC-06 Preconditions|requestWithdrawal(applicationId),<br>withdrawApplication(applicationId, reason)|CO-06.1, CO-06.2|
|FR-UC06.2|UC-06 steps 1–2|requestWithdrawal(applicationId)|CO-06.1|
|FR-UC06.3|UC-06 step 3|withdrawApplication(applicationId, reason)|CO-06.2|
|FR-UC06.4|UC-06 step 4, extensions 4a–4b|withdrawApplication(applicationId, reason)|CO-06.2|
|FR-UC06.5|UC-06 step 5|withdrawApplication(applicationId, reason)|CO-06.2|
|FR-UC06.6|UC-06 Success Guarantee|withdrawApplication(applicationId, reason)|CO-06.2|
|FR-UC06.7|UC-06 step 6|withdrawApplication(applicationId, reason)|CO-06.2|
|FR-UC06.8|UC-06 extension 6a|withdrawApplication(applicationId, reason)|CO-06.2|
|FR-UC06.9|UC-06 Special Requirements|withdrawApplication(applicationId, reason)|CO-06.2|
|FR-UC07.1|UC-07 steps 1–2|viewOffer(applicationId)|CO-07.1|
|FR-UC07.2|UC-07 step 3, extension 3a|acceptOffer(applicationId),<br>declineOffer(applicationId, reason)|CO-07.2, CO-07.3|
|FR-UC07.3|UC-07 steps 4–5; UC-07 extensions<br>3a, 3b, 5a|acceptOffer(applicationId),<br>declineOffer(applicationId, reason)|CO-07.2, CO-07.3|
|FR-UC07.4|UC-07 step 6|acceptOffer(applicationId)|CO-07.2|
|FR-UC07.5|UC-07 extension 3a, Success<br>Guarantee|declineOffer(applicationId, reason)|CO-07.3|
|FR-UC07.6|UC-07 extension 6a|acceptOffer(applicationId),<br>declineOffer(applicationId, reason)|CO-07.2, CO-07.3|
|FR-UC07.7|UC-07 extension 6c|acceptOffer(applicationId)|CO-07.2|
|FR-UC07.8|UC-07 steps 7–8|acceptOffer(applicationId),<br>declineOffer(applicationId, reason)|CO-07.2, CO-07.3|
|FR-UC07.9|UC-07 extension 7a|acceptOffer(applicationId),<br>declineOffer(applicationId, reason)|CO-07.2, CO-07.3|
|FR-UC07.10|UC-07 Special Requirements|acceptOffer(applicationId)|CO-07.2|
|FR-UC07.11|UC-07 extension 6b|acceptOffer(applicationId)|CO-07.2|
|FR-UC08.1|UC-08 step 4, extension 4a|submitRecruiterRegistration(recruiterData,<br>organizationData)|CO-08.1|
|FR-UC08.2|UC-08 step 4, extension 4b|submitRecruiterRegistration(recruiterData,<br>organizationData)|CO-08.1|
|FR-UC08.3|UC-08 step 4, extension 4c|submitRecruiterRegistration(recruiterData,<br>organizationData)|CO-08.1|
|FR-UC08.4|UC-08 steps 6–7|verifyRecruiterEmail(token)|CO-08.2|
|FR-UC09.1|UC-09 step 6, extensions 6a–6b|submitMembershipRequest(organizationId, role,<br>justification)|CO-09.1|
|FR-UC09.2|UC-09 Success Guarantee|submitMembershipRequest(organizationId, role,<br>justification)|CO-09.1|
|FR-UC09.3|UC-09 extension 3a|none for UC-09 ext. 3a|none for UC-09 ext. 3a|
|FR-UC10.1|UC-10 Preconditions, Special<br>Requirements|openApprovalQueue()|query (no contract)|
|FR-UC10.2|UC-10 step 6|approveRequest(requestId)|CO-10.1|
|FR-UC10.3|UC-10 step 7, extension 5a|approveRequest(requestId); none for UC-10 ext.<br>5a|CO-10.1; none for UC-10 ext.<br>5a|
|FR-UC11.1|UC-11 Preconditions, extension 2a|selectCreatePosting(),<br>submitJobPosting(organizationId, postingData)|query (no contract), CO-11.1|
|FR-UC11.2|UC-11 steps 3 and 5, extension 5a|submitJobPosting(organizationId, postingData)|CO-11.1|
|FR-UC11.3|UC-11 steps 3 and 5|submitJobPosting(organizationId, postingData)|CO-11.1|
|FR-UC11.4|UC-11 step 5, extension 5b|submitJobPosting(organizationId, postingData)|CO-11.1|
|FR-UC11.5|UC-11 step 6|submitJobPosting(organizationId, postingData)|CO-11.1|
|FR-UC11.6|UC-11 Success Guarantee|submitJobPosting(organizationId, postingData)|CO-11.1|
|FR-UC11.7|UC-11 extension 3b|none for UC-11 ext. 3b|none for UC-11 ext. 3b|
|FR-UC11.8|UC-11 extension 6a; UC-12<br>extension 5a|submitJobPosting(organizationId, postingData);<br>none for UC-12 ext. 5a|CO-11.1; none for UC-12 ext.<br>5a|
|FR-UC12.1|UC-12 Preconditions|openPostingApprovalQueue()|query (no contract)|
|FR-UC12.2|UC-12 step 2|openPostingApprovalQueue()|query (no contract)|
|FR-UC12.3|UC-12 step 4|selectPosting(postingId)|query (no contract)|
|FR-UC12.4|UC-12 step 6|approveJobPosting(postingId)|CO-12.1|
|FR-UC12.5|UC-12 extension 5a|none for UC-12 ext. 5a|none for UC-12 ext. 5a|
|FR-UC12.6|UC-12 extension 5b|none for UC-12 ext. 5b|none for UC-12 ext. 5b|
|FR-UC12.7|UC-12 extensions 6a, 6b|approveJobPosting(postingId)|CO-12.1|
|FR-UC12.8|UC-12 step 7; UC-12 extensions 5a,<br>5b|approveJobPosting(postingId); none for UC-12<br>ext. 5a, 5b|CO-12.1; none for UC-12 ext.<br>5a, 5b|
|FR-UC13.1|UC-13 step 1, Special Requirements|runExpirationJob()|CO-13.1|
|FR-UC13.2|UC-13 step 2|runExpirationJob()|CO-13.1|
|FR-UC13.3|UC-13 step 3|runExpirationJob()|CO-13.1|
|FR-UC13.4|UC-13 Success Guarantee|runExpirationJob()|CO-13.1|
|FR-UC13.5|UC-13 extension 2b|runExpirationJob()|CO-13.1|
|FR-UC13.6|UC-13 extension 3a|runExpirationJob()|CO-13.1|
|FR-UC13.7|UC-13 step 4|runExpirationJob()|CO-13.1|
|FR-UC13.8|UC-13 step 5|runExpirationJob()|CO-13.1|
|FR-UC14.1|UC-14 steps 1–2|listPostings()|query (no contract)|
|FR-UC14.2|UC-14 steps 3–4|reviewApplication(applicationId)|CO-14.1|
|FR-UC14.3|UC-14 steps 5–6|advanceApplication(applicationId, note)|CO-14.2|
|FR-UC14.4|UC-14 step 7|advanceApplication(applicationId, note)|CO-14.2|
|FR-UC14.5|UC-14 extension 5b|advanceApplication(applicationId, note)|CO-14.2|
|FR-UC14.6|UC-14 extension 5a|rejectApplication(applicationId, reason,<br>comment)|CO-14.3|
|FR-UC14.7|UC-14 extension 5c|recordInterview(applicationId, interviewDetails)|CO-14.4|
|FR-UC14.8|UC-14 extension 5d|advanceApplication(applicationId, note)|CO-14.2|
|FR-UC14.9|UC-14 extension *a|reviewApplication(applicationId)|CO-14.1|
|FR-UC14.10|UC-14 extension 6a|advanceApplication(applicationId, note),<br>rejectApplication(applicationId, reason,<br>comment)|CO-14.2, CO-14.3|
|FR-UC14.11|UC-14 extension 2a|listPostings()|query (no contract)|
|FR-UC15.1|UC-15 steps 1–2, extension 1a|startOffer(applicationId)|query (no contract)|
|FR-UC15.2|UC-15 step 3, Special Requirements|extendOffer(applicationId, offerTerms)|CO-15.1|
|FR-UC15.3|UC-15 step 4, extension 4a|extendOffer(applicationId, offerTerms)|CO-15.1|
|FR-UC15.4|UC-15 step 5, extension 5a|extendOffer(applicationId, offerTerms)|CO-15.1|
|FR-UC15.5|UC-15 step 6|extendOffer(applicationId, offerTerms)|CO-15.1|
|FR-UC15.6|UC-15 steps 7–8|extendOffer(applicationId, offerTerms)|CO-15.1|
|FR-UC15.7|UC-15 extension 1b|reviseOffer(applicationId, offerTerms)|CO-15.2|
|FR-UC15.8|UC-15 extensions 2a, 2b|startOffer(applicationId)|query (no contract)|
|FR-UC15.9|UC-15 extension 5b|extendOffer(applicationId, offerTerms),<br>reviseOffer(applicationId, offerTerms)|CO-15.1, CO-15.2|
|FR-UC15.10|UC-15 extension *a|startOffer(applicationId)|query (no contract)|
