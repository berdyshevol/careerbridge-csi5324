# CareerBridge — Design

> Part of the CareerBridge specification — see the [index](README.md).

## 6. Sequence Diagrams (Design)

One design sequence diagram per system operation of the implemented use cases, and the design of
use cases not built yet. Each shows how the objects of [architecture.md](architecture.md) realize an
operation contract of [ssd-and-contracts.md](ssd-and-contracts.md):

- a diagram starts at the HTTP request the actor sends to a controller and ends at its response;
  pages and other user-interface steps are left out (Deliverable 3 feedback);
- the controller hands the request to the service method named after the system operation;
- the service applies the business rules, creates and changes entities and calls repositories;
- a refusal is an exception that the controller turns into an HTTP status with a reason in plain
  text or, for refused fields, a field-to-reason map;
- names are the class and method names in the code on `main`.

The diagrams are Mermaid source, so GitHub draws them and the Deliverable PDF is rendered from the
same text.

### UC-01 Search Job Postings

One request carries the visitor's criteria, any of them blank, and one answer returns the matching
open postings with all their details (CO-01.1). The service loads the published postings whose
deadline date has not passed anywhere, keeps those still open at this moment in their
organization's time zone (`JobPosting.isOpen`, BR-10) and filters them by each criterion given,
ignoring case: a keyword is part of the title, description or requirements, an organization is part
of its name, and location and employment type match exactly. It returns them newest first
(FR-UC01.1, FR-UC01.2). The controller turns each posting into a `PublicPosting`, which leaves out
who approved it and when, the review comment and the organization's account status, and adds the
moment applications close, so the answer holds no internal data (BR-3). An empty answer is
extension 2a with no criteria, 2b with criteria.

```mermaid
sequenceDiagram
    actor V as Visitor
    participant JC as JobPosting<br/>Controller
    participant JS as JobPosting<br/>Service
    participant JR as JobPosting<br/>Repository

    V->>JC: GET /api/postings?keyword&location&organization&employmentType<br/>(criteria left blank are left out)
    JC->>JS: searchPostings(criteria)
    JS->>JR: findByPostStatusAndApplicationDeadline...<br/>(PUBLISHED, today in the latest zone)
    JR-->>JS: List<JobPosting>, newest first
    JS->>JS: keep posting.isOpen(now) and<br/>each criterion given, ignoring case
    JS-->>JC: List<JobPosting>
    JC->>JC: PublicPosting.of(posting) for each
    JC-->>V: 200 List<PublicPosting> with their details<br/>(empty: ext. 2a, 2b)
```

**Figure 26: SD-1 Search Job Postings (UC-01)**

### UC-02 Register as Applicant

The service first normalises the input, collapsing any spaces in the full name and stripping and
lower-casing the email address, the way log-in looks it up, and checks the fields of CO-02.1: a full
name with a last name, a well-formed email address, at most 255 characters each, and the password
policy of A15 (at least 10 characters, including a letter and a number; at most 72 bytes, which
BCrypt reads). Every invalid field comes back at once with its reason (extensions 2a, 2c). Only then
does the service look the address up and refuse it if an account already exists (2b). Otherwise it
creates the Applicant as Active, keeps only a hash of the password and saves it; the unique
constraint on the email turns two registrations at the same moment into the same refusal. No
verification email is sent (A15): LogInService signs a token for the new Applicant (ADR-0010), and
the answer carries it, so the Applicant is logged in.

```mermaid
sequenceDiagram
    actor V as Visitor
    participant RC as Registration<br/>Controller
    participant RS as Registration<br/>Service
    participant UR as UserRepository
    participant PE as PasswordEncoder
    participant LS as LogInService

    V->>RC: POST /api/applicants<br/>{fullName, email, password}
    RC->>RS: register(fullName, email, password)
    RS->>RS: normalise (spaces in the name, email stripped,<br/>lower-cased → address), validate fields:<br/>full name with a last name, email well formed,<br/>lengths, password policy (A15)

    alt invalid fields (ext. 2a, 2c)
        RS-->>RC: RegistrationRefusedException(fieldErrors)
        RC-->>V: 400 {field: reason}, nothing saved
    else fields valid
        RS->>UR: findByEmailIgnoreCase(address)
        alt email already registered (ext. 2b)
            UR-->>RS: Optional<User> (present)
            RS-->>RC: AlreadyRegisteredException
            RC-->>V: 409 "An account already exists…", nothing saved
        else all checks pass
            UR-->>RS: Optional<User> (empty)
            create participant A as :Applicant
            RS->>A: new Applicant()
            RS->>A: setFirstName(..), setLastName(..), setEmail(address),<br/>setAccountStatus(ACTIVE)
            RS->>PE: encode(password)
            PE-->>RS: hash
            RS->>A: setPasswordHash(hash)
            RS->>UR: saveAndFlush(applicant)
            alt same email registered at the same moment (ext. 2b)
                UR-->>RS: DataIntegrityViolationException
                RS-->>RC: AlreadyRegisteredException
                RC-->>V: 409 "An account already exists…", nothing saved
            else saved
                UR-->>RS: Applicant
                RS->>LS: startSession(applicant)
                Note over LS: JwtEncoder signs the token (HS256):<br/>subject email, claim role=APPLICANT,<br/>issued now, expires in 8 h
                LS-->>RS: LoggedIn(token, applicant)
                RS-->>RC: LoggedIn
                RC-->>V: 201 LoggedInResponse {token, user}
            end
        end
    end
```

**Figure 27: SD-8 Register as an applicant (UC-02)**

### UC-03 Update Applicant Profile

Viewing and saving the profile (SD-9, CO-03.1 and CO-03.2) and uploading a resume (SD-10, CO-03.3)
are built. The logged-in Applicant is the subject of the session token (ADR-0010); the
controller passes that email to the service, so an applicant can only ever read and change their own
profile (BR-15). CO-03.2 changes First Name and Last Name, which every User has, and phone #,
location, headline, skills, education and work experience, the profile details of step 2.

**SD-9.** The service reads the Applicant with the resume on file, if any (CO-03.1). On save it
checks the fields (a first and a last name, a well-formed phone number or none, as registration
does not ask for one, and no field longer than its column: 255 characters for the names, location
and headline, 2,000 for skills, 4,000 for education, 10,000 for work experience) and returns every
invalid one with its reason (extension 4a); otherwise it changes the Applicant (CO-03.2).

```mermaid
sequenceDiagram
    actor AP as Applicant
    participant PC as ApplicantProfile<br/>Controller
    participant PS as ApplicantProfile<br/>Service
    participant AR as Applicant<br/>Repository
    participant A as :Applicant

    AP->>PC: GET /api/applicant/profile (bearer token)
    PC->>PS: viewProfile(email)
    PS->>AR: findByEmailIgnoreCase(email)
    AR-->>PS: Applicant, with its Resume if any
    PS-->>PC: Applicant
    PC-->>AP: 200 ProfileResponse {firstName, lastName, email,<br/>phone, location, headline, skills, education,<br/>workExperience, resume {fileName, uploadDate}}

    AP->>PC: PUT /api/applicant/profile<br/>{firstName, lastName, phone, location,<br/>headline, skills, education, workExperience}
    PC->>PS: updateProfile(email, details)
    PS->>PS: validate: first and last name present,<br/>phone well formed, lengths within the columns
    alt invalid fields (ext. 4a)
        PS-->>PC: ProfileRefusedException(fieldErrors)
        PC-->>AP: 400 {field: reason}, nothing saved
    else fields valid
        PS->>AR: findByEmailIgnoreCase(email)
        AR-->>PS: Applicant
        PS->>A: setFirstName(..), setLastName(..), setPhone(..),<br/>setLocation(..), setHeadline(..), setSkills(..),<br/>setEducation(..), setWorkExperience(..)
        PS->>AR: save(applicant)
        AR-->>PS: Applicant
        PS-->>PC: Applicant
        PC-->>AP: 200 ProfileResponse
    end
```

**Figure 28: SD-9 Update applicant profile (UC-03)**

**SD-10.** The file comes as a multipart upload. The service accepts only a PDF or DOCX of at most
5 MB: the file name's extension, the type the browser declares (or none, or
`application/octet-stream`) and the file's first bytes (`%PDF`, or the `PK` of the zip a DOCX is)
must agree. Otherwise it refuses the file with a reason in plain text that states the accepted
types and size, keeping the current resume (extension 6a). A file over the multipart limit never
reaches the service; the controller answers it with the same reason. An accepted file becomes a
new Resume with its name, type, size, content and upload date (UTC), stored in the database, and
replaces the Applicant's previous one: an applicant has at most one resume (BR-6). The previous
Resume is deleted, as nothing else refers to it: applications already submitted keep their own
Resume Snapshot, an embedded copy with the file's content that submitApplication (CO-04.1) makes
from the resume on file, so replacing the resume changes none of them (FR-UC03.3, A6). No
external malware scanner is used (Iteration 1 feedback).

```mermaid
sequenceDiagram
    actor AP as Applicant
    participant PC as ApplicantProfile<br/>Controller
    participant PS as ApplicantProfile<br/>Service
    participant AR as Applicant<br/>Repository
    participant RR as Resume<br/>Repository
    participant A as :Applicant

    AP->>PC: POST /api/applicant/resume<br/>(multipart file, bearer token)
    PC->>PS: uploadResume(email, file)
    PS->>PS: check type (PDF or DOCX: name, declared type,<br/>first bytes) and size (at most 5 MB)
    alt not a PDF or DOCX, or larger than 5 MB (ext. 6a)
        PS-->>PC: ResumeRefusedException(reason)
        PC-->>AP: 400 reason, current resume kept
    else file accepted
        PS->>AR: findByEmailIgnoreCase(email)
        AR-->>PS: Applicant
        create participant R as :Resume
        PS->>R: new Resume(fileName, fileType,<br/>fileSize, content, uploadDate = now)
        PS->>RR: save(resume)
        RR-->>PS: Resume
        PS->>A: setResume(resume)
        PS->>AR: save(applicant)
        AR-->>PS: Applicant
        PS->>RR: delete(previous)
        Note over RR: the previous Resume, if any, is gone (BR-6),<br/>application snapshots are copies, unchanged (A6)
        PS-->>PC: Resume
        PC-->>AP: 201 ResumeResponse {fileName, uploadDate}
    end
```

**Figure 29: SD-10 Upload a resume (UC-03)**

### UC-04 Apply for Job

SD-3 keeps the number it had in Deliverable 3. It shows startApplication, which presents the
application summary, and submitApplication (CO-04.1). The logged-in Applicant is the subject of the
session token (ADR-0010). Only the Applicant role reaches `/api/postings/{postingId}/application`:
a visitor who is not logged in is answered 401 and a Recruiter or Administrator 403 (extensions 1a,
1b). A posting that does not exist is 404.

startApplication only reads. A missing resume (extension 2a) or 5 active applications (2b) comes
back as a refusal inside the answer, not as an error, so the screen shows it beside the summary.

submitApplication checks, in this order: the posting is Published and its deadline day is not over
in the organization's time zone (4a, BR-10); a resume is on file (2a, BR-6); the applicant has never
applied to this posting, in any stage, withdrawn included (4c, A5); and the applicant has fewer than
5 active applications (4b, BR-4). Each refusal is an ApplicationRefusedException with a reason
written for the applicant, which the controller answers with 409. Only then does the service create
the Application. It gets the date applied in the organization's time zone, a Resume Snapshot that
copies the file's content, so a later resume changes nothing (A6), and the first status history
entry, Applied. The unique constraint on applicant and posting turns a double click into the 4c
refusal. The answer carries the new count of active applications for step 7.

Not built yet: the confirmation of step 6 (no Notification is created) and the limit of 5 under
submissions at the same moment to different postings, which the count alone does not hold.

```mermaid
sequenceDiagram
    actor AP as Applicant
    participant AC as Application<br/>Controller
    participant AS as Application<br/>Service
    participant JR as JobPosting<br/>Repository
    participant UR as Applicant<br/>Repository
    participant AR as Application<br/>Repository

    AP->>AC: GET /api/postings/{postingId}/application<br/>(bearer token)
    AC->>AS: startApplication(postingId, email)
    AS->>JR: findById(postingId)
    JR-->>AS: JobPosting
    AS->>UR: findByEmailIgnoreCase(email)
    UR-->>AS: Applicant, with its Resume if any
    AS->>AR: findByApplicantAndApplicationStatusIn(applicant, ACTIVE)
    AR-->>AS: active Applications
    AS->>AS: refusal = NO_RESUME if no resume (ext. 2a),<br/>LIMIT_REACHED if 5 active (ext. 2b), else none
    AS-->>AC: ApplicationStart
    AC-->>AP: 200 ApplicationStartResponse {posting, applicant,<br/>resume, activeApplications, activeApplicationCount,<br/>applicationLimit, refusal}

    AP->>AC: POST /api/postings/{postingId}/application<br/>(bearer token)
    AC->>AS: submitApplication(postingId, email)
    AS->>JR: findById(postingId)
    JR-->>AS: JobPosting
    AS->>AS: posting.isOpen(now): Published, before 23:59<br/>of the deadline in the organization's zone
    break posting closed (ext. 4a)
        AS-->>AC: ApplicationRefusedException(POSTING_CLOSED)
        AC-->>AP: 409 {reason, message}, nothing saved
    end
    AS->>UR: findByEmailIgnoreCase(email)
    UR-->>AS: Applicant, with its Resume if any
    break no resume on file (ext. 2a)
        AS-->>AC: ApplicationRefusedException(NO_RESUME)
        AC-->>AP: 409 {reason, message}, nothing saved
    end
    AS->>AR: existsByApplicantAndJobPosting(applicant, posting)
    AR-->>AS: applied before?
    break applied before, withdrawn included (ext. 4c, A5)
        AS-->>AC: ApplicationRefusedException(ALREADY_APPLIED)
        AC-->>AP: 409 {reason, message}, nothing saved
    end
    AS->>AR: countActiveByApplicant(applicant)
    AR-->>AS: active
    break 5 active applications (ext. 4b, BR-4)
        AS-->>AC: ApplicationRefusedException(LIMIT_REACHED)
        AC-->>AP: 409 {reason, message}, nothing saved
    end
    create participant A as :Application
    AS->>A: new Application(applicant, posting,<br/>ResumeSnapshot.of(resume), dateApplied)
    Note over A: applicationStatus Applied, statusHistory gains<br/>Applied with dateApplied, the snapshot copies<br/>the file's content (A6)
    AS->>AR: saveAndFlush(application)
    alt same posting submitted at the same moment (ext. 4c)
        AR-->>AS: DataIntegrityViolationException
        AS-->>AC: ApplicationRefusedException(ALREADY_APPLIED)
        AC-->>AP: 409 {reason, message}, nothing saved
    else saved
        AR-->>AS: Application
        AS-->>AC: SubmittedApplication(application, active + 1)
        AC-->>AP: 201 ApplicationResponse {applicationId,<br/>applicationStatus, activeApplicationCount}
    end
```

**Figure 30: SD-3 Apply for a job (UC-04)**

### UC-08 Register Recruiter and Organization

Registration creates the Recruiter as Pending Approval, the Organization as Pending Approval unless
the name already belongs to a registered one (extension 4c), and an Organization Membership as
Awaiting Verification, then asks for email verification. Only a verified request reaches the
Administrator's queue.

The service checks every field first, with the same rules as UC-02 for the name, email and password
plus a job title and the organization's legal name and website (4a). An email already registered is
refused (4b); for an approved recruiter the reason points to UC-09. A registered organization is one
whose normalized legal name (lower case, punctuation and suffixes such as "Inc." and "Co." dropped)
or website domain matches the new one (FR-UC08.3); the visitor is offered membership in it and, on
accepting, sends the registration again with its `joinOrganizationId` (4c). A work email outside the
organization's website domain is accepted but flagged for the Administrator (4d, A17). The emailed
link holds a random token; only its SHA-256 hash is stored, and it expires after 24 hours (6a).
NotificationService stands in for the Notification Service: it saves each Notification as Pending
and logs it (7a). Without a mail service, a demonstration or the test database
(`careerbridge.demo.verification-links`, or an in-memory database) hands the link back in the answer.

```mermaid
sequenceDiagram
    actor V as Visitor
    participant RC as RecruiterRegistration<br/>Controller
    participant RS as RecruiterRegistration<br/>Service
    participant UR as UserRepository
    participant OR as OrganizationRepository
    participant MR as OrganizationMembership<br/>Repository
    participant NS as NotificationService
    participant R as :Recruiter
    participant M as :OrganizationMembership

    V->>RC: POST /api/recruiters<br/>{fullName, jobTitle, email, phone, password,<br/>organization | joinOrganizationId}
    RC->>RS: submitRecruiterRegistration(recruiterData,<br/>organizationData, joinOrganizationId)
    RS->>RS: validate fields (AccountRules, OrganizationRules)
    alt invalid fields (ext. 4a)
        RS-->>RC: RegistrationRefusedException(fieldErrors)
        RC-->>V: 400 {field: reason}, nothing saved
    else fields valid
        RS->>UR: findByEmailIgnoreCase(email)
        alt email already registered (ext. 4b)
            RS-->>RC: AlreadyRegisteredException
            RC-->>V: 409 {reason: EMAIL_REGISTERED, message}
        else new email
            opt new organization
                RS->>OR: findAll()
                alt duplicates a registered organization (ext. 4c)
                    RS-->>RC: OrganizationAlreadyRegisteredException(organization)
                    RC-->>V: 409 {reason: ORGANIZATION_REGISTERED, organization}
                end
            end
            RS->>R: new Recruiter(), accountStatus PENDING_APPROVAL,<br/>emailVerified false, startVerification(hash, +24 h)
            RS->>UR: saveAndFlush(recruiter)
            opt new organization
                RS->>OR: save(organization PENDING_APPROVAL)
            end
            RS->>M: new(recruiter, organization, AWAITING_VERIFICATION,<br/>requestType, now); setReviewFlag(..) (ext. 4d)
            RS->>MR: save(membership)
            RS->>NS: notify(recruiter, EMAIL_VERIFICATION, link)
            RS-->>RC: RecruiterRegistration(membership, link?)
            RC-->>V: 201 {email, organizationName, joinsExistingOrganization, verificationLink?}
        end
    end
```

**Figure 31: SD-11 Register a recruiter and organization (UC-08)**

```mermaid
sequenceDiagram
    actor V as Visitor
    participant RC as RecruiterRegistration<br/>Controller
    participant RS as RecruiterRegistration<br/>Service
    participant RR as RecruiterRepository
    participant MR as OrganizationMembership<br/>Repository
    participant NS as NotificationService

    V->>RC: POST /api/recruiters/verification {token}
    RC->>RS: verifyRecruiterEmail(token)
    RS->>RR: findByVerificationTokenHash(sha256(token))
    alt no such token: never sent or already used
        RS-->>RC: VerificationLinkException(expired=false)
        RC-->>V: 404 {expired: false, message}
    else expired (ext. 6a)
        RS-->>RC: VerificationLinkException(expired=true)
        RC-->>V: 410 {expired: true, message}
    else valid
        RS->>RS: recruiter.markEmailVerified()
        RS->>MR: findByRecruiterAndStatus(recruiter, AWAITING_VERIFICATION)
        loop each membership
            RS->>RS: membership.setStatus(PENDING)
            RS->>NS: notifyAdministrators(NEW_RECRUITER_REQUEST, ..)
        end
        RC-->>V: 200 {email}
    end
```

**Figure 32: SD-12 Verify a recruiter's email (UC-08)**

### UC-09 Join Additional Organization

Searching organizations is a read of OrganizationRepository and changes nothing
(`GET /api/organizations?query=`, no role; only registered organizations, matched on name and
website). The request is refused if the recruiter is already a member (extension 6a) or has a
request pending (6b); both are MembershipConflictException (409) with the existing status. A
denied or cancelled request does not block a new one. The recruiter's row is locked while the
request is checked, so two requests sent at once are checked one after the other. CO-09.1's
preconditions are checked too: the account is Active and has at least one Active membership.
Extension 3a sends the new organization's details instead of an id; it is created Pending Approval
after the same duplicate check as UC-08. A pending request can be cancelled (\*a).

```mermaid
sequenceDiagram
    actor R as Recruiter
    participant MC as RecruiterMembership<br/>Controller
    participant MS as MembershipService
    participant RR as RecruiterRepository
    participant OR as OrganizationRepository
    participant MR as OrganizationMembership<br/>Repository
    participant NS as NotificationService
    participant M as :OrganizationMembership

    R->>MC: POST /api/recruiter/memberships<br/>{organizationId, role, justification}
    MC->>MS: submitMembershipRequest(email, organizationId, role, justification)
    MS->>RR: lockByEmail(email)
    MS->>MR: findByRecruiterAndStatus(recruiter, ACTIVE)
    alt not approved, or no Active membership
        MS-->>MC: RecruiterNotApprovedException
        MC-->>R: 403 reason
    else approved
        MS->>OR: findById(organizationId), registered only
        alt missing role, justification or organization
            MS-->>MC: MembershipRequestRefusedException(fieldErrors)
            MC-->>R: 400 {field: reason}
        else valid
            MS->>MR: findByRecruiterOrderByRequestedAtAscMembershipIdAsc(recruiter)
            alt already a member (ext. 6a)
                MS-->>MC: MembershipConflictException(ACTIVE)
                MC-->>R: 409 {status: ACTIVE, statusLabel, message}
            else request already open (ext. 6b)
                MS-->>MC: MembershipConflictException(PENDING …)
                MC-->>R: 409 {status, statusLabel, message}
            else
                    MS->>M: new(recruiter, organization, PENDING,<br/>ADDITIONAL_ORGANIZATION, now)
                MS->>MR: save(membership)
                MS->>NS: notifyAdministrators(MEMBERSHIP_REQUEST, ..)
                MS->>NS: notify(recruiter, REQUEST_CONFIRMATION, ..)
                MC-->>R: 201 MembershipResponse {status: PENDING}
            end
        end
    end
```

**Figure 33: SD-13 Ask to join another organization (UC-09)**

### UC-10 Approve Recruiter/Organization Request

Only the Administrator role reaches `/api/admin/**`. Approval activates the membership and, for a
first request, the recruiter's account and the new organization. If the new organization
duplicates a registered one (extension 5c) it is deleted and the membership points to the
existing one. A request already decided or cancelled is MembershipConflictException (409;
extension 6a). The request's row is locked, so a second Administrator waits and then finds it
decided. Denying (5a) and asking for information (5b) need a note, which the requester receives;
an account or organization created only for a denied request becomes Inactive. Every decision
records who decided and when (NFR-UC10.1).

```mermaid
sequenceDiagram
    actor A as Administrator
    participant AC as AdminMembershipRequest<br/>Controller
    participant AS as MembershipApproval<br/>Service
    participant MR as OrganizationMembership<br/>Repository
    participant OR as OrganizationRepository
    participant NS as NotificationService

    A->>AC: POST /api/admin/requests/{requestId}/approve
    AC->>AS: approveRequest(requestId, administrator)
    AS->>MR: lockById(requestId)
    alt not found
        AS-->>AC: MembershipNotFoundException
        AC-->>A: 404 reason
    else decided or cancelled (ext. 6a)
        AS-->>AC: MembershipConflictException(status)
        AC-->>A: 409 {status, statusLabel, "This request is now …. Nothing was changed."}
    else Pending or Information Requested
        opt organization is Pending Approval
            AS->>OR: findAll()
            alt duplicates a registered organization (ext. 5c)
                AS->>MR: findByOrganization(duplicate)
                AS->>AS: each membership.setOrganization(registered)
                AS->>OR: delete(duplicate)
            else new organization
                AS->>AS: organization.setOrganizationStatus(ACTIVE)
            end
        end
        opt recruiter is Pending Approval (first request)
            AS->>AS: recruiter.setAccountStatus(ACTIVE)
        end
        AS->>AS: membership.approve(administrator, now)
        AS->>NS: notify(recruiter, REQUEST_APPROVED, ..)
        AC-->>A: 200 MembershipResponse {status: ACTIVE}
    end
```

**Figure 34: SD-14 Approve a recruiter or organization request (UC-10)**

## 7. Design Class Diagram (DCD)

Not written yet. Iteration 2 adds the design class diagram, consistent with the sequence diagrams
above and with the [domain model](domain-model.md).

### 7.1 Consistency with the sequence diagrams

Every system operation in a sequence diagram above, and the classes and methods that realize it;
the DCD must contain each of them.

| Diagram | Controller method | Service method | Repository calls |
| --- | --- | --- | --- |
| SD-1 | `JobPostingController.searchPostings`; `PublicPosting.of` | `JobPostingService.searchPostings`; `JobPosting.isOpen` | `JobPostingRepository.findByPostStatusAndApplicationDeadlineGreaterThanEqualOrderByDatePostedDescJobPostIdDesc` |
| SD-3 | `ApplicationController.startApplication`, `submitApplication` | `ApplicationService.startApplication`, `submitApplication`; `JobPosting.isOpen`; `ResumeSnapshot.of` | `JobPostingRepository.findById`; `ApplicantRepository.findByEmailIgnoreCase`; `ApplicationRepository.findByApplicantAndApplicationStatusIn`, `existsByApplicantAndJobPosting`, `countActiveByApplicant`, `saveAndFlush` |
| SD-8 | `RegistrationController.register` | `RegistrationService.register`; `LogInService.startSession` | `UserRepository.findByEmailIgnoreCase`, `saveAndFlush` |
| SD-9 | `ApplicantProfileController.viewProfile`, `updateProfile` | `ApplicantProfileService.viewProfile`, `updateProfile` | `ApplicantRepository.findByEmailIgnoreCase`, `save` |
| SD-10 | `ApplicantProfileController.uploadResume` | `ApplicantProfileService.uploadResume` | `ApplicantRepository.findByEmailIgnoreCase`, `save`; `ResumeRepository.save`, `delete` |
| SD-11 | `RecruiterRegistrationController.submitRecruiterRegistration` | `RecruiterRegistrationService.submitRecruiterRegistration`; `OrganizationRules.rejectDuplicate`; `NotificationService.notify` | `UserRepository.findByEmailIgnoreCase`; `RecruiterRepository.saveAndFlush`; `OrganizationRepository.findAll`, `findByName`, `save`; `OrganizationMembershipRepository.save` |
| SD-12 | `RecruiterRegistrationController.verifyRecruiterEmail` | `RecruiterRegistrationService.verifyRecruiterEmail`; `NotificationService.notifyAdministrators` | `RecruiterRepository.findByVerificationTokenHash`; `OrganizationMembershipRepository.findByRecruiterAndStatus` |
| SD-13 | `RecruiterMembershipController.submitMembershipRequest` | `MembershipService.submitMembershipRequest`; `NotificationService.notify`, `notifyAdministrators` | `RecruiterRepository.lockByEmail`; `OrganizationRepository.findById`; `OrganizationMembershipRepository.findByRecruiterAndStatus`, `findByRecruiterOrderByRequestedAtAscMembershipIdAsc`, `save` |
| SD-14 | `AdminMembershipRequestController.approveRequest` | `MembershipApprovalService.approveRequest`; `NotificationService.notify` | `OrganizationMembershipRepository.lockById`, `findByOrganization`; `OrganizationRepository.findAll`, `delete` |
