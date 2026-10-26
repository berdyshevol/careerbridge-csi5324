# CareerBridge — Design

> Part of the CareerBridge specification — see the [index](README.md).

## 6. Sequence Diagrams (Design)

One design sequence diagram per system operation of the implemented use cases, and the design of use cases not built yet. Each shows how the
objects of [architecture.md](architecture.md) realize an operation contract of
[ssd-and-contracts.md](ssd-and-contracts.md):

- the page sends one HTTP request (the call in `lib/api.ts` is folded into it);
- a controller hands it to the service method named after the system operation;
- the service applies the business rules, creates and changes entities and calls repositories;
- a refusal is an exception that the controller turns into an HTTP status with a reason in plain
  text or, for refused fields, a field-to-reason map;
- names are the class and method names in the code on `main`.

The diagrams are Mermaid source, so GitHub draws them and the Deliverable PDF is rendered from the
same text.

### UC-01 Search Job Postings

The job board is a server-rendered page: it reads the criteria from its address, first redirects to
a clean address that holds only the criteria given, so a search can be bookmarked and shared, and
asks the backend for the open postings with one request. The service loads the published postings
whose deadline date has not passed anywhere, keeps those still open at this moment in their
organization's time zone (`JobPosting.isOpen`, BR-10) and filters them by each criterion, ignoring
case: a keyword is part of the title, description or requirements, an organization is part of its
name, and location and employment type match exactly. It returns them newest first (FR-UC01.1,
FR-UC01.2). The controller turns each posting into a `PublicPosting`, which leaves out who approved
it and when, the review comment and the organization's account status, and adds the moment
applications close, so the public page shows no internal data (BR-3). With no criteria, an empty
answer ends the use case with a message (extension 2a); an empty answer to a search shows a message
and a link that clears the filters, and the visitor searches again (extension 4a). If the backend
does not answer, the page says so and keeps the criteria (extension *a). Opening one posting from
the list is a page of its own, not a step of UC-01 (Iteration 1 feedback).

```mermaid
sequenceDiagram
    actor V as Visitor
    participant JP as JobsPage
    participant JC as JobPosting<br/>Controller
    participant JS as JobPosting<br/>Service
    participant JR as JobPosting<br/>Repository

    V->>JP: open the job board, or submit keyword,<br/>location, organization, employment type
    JP->>JP: searchCriteria(query), searchQuery(criteria),<br/>redirect to the clean /jobs?… if the address differs
    JP->>JC: GET /api/postings?{the criteria given}
    alt backend fails or does not answer in time (ext. *a)
        JP-->>V: BackendDown: "the server is not answering",<br/>criteria kept in the form
    else answered
        JC->>JS: searchPostings(criteria)
        JS->>JR: findByPostStatusAndApplicationDeadline...<br/>(PUBLISHED, today in the latest zone)
        JR-->>JS: List<JobPosting>, newest first
        JS->>JS: keep posting.isOpen(now) and<br/>each criterion given, ignoring case
        JS-->>JC: List<JobPosting>
        JC->>JC: PublicPosting.of(posting) for each
        JC-->>JP: 200 List<PublicPosting>
        alt empty list, no criteria given (ext. 2a)
            JP-->>V: "No open positions right now."
        else empty list for the criteria (ext. 4a)
            JP-->>V: "No matching postings." and Clear the filters
        else postings found
            JP-->>V: one PostingCard per posting: title, organization,<br/>location, employment type, deadline
        end
    end
```

**Figure 26: SD-1 Search Job Postings (UC-01)**

### UC-02 Register as Applicant

A logged-in user who opens `/register` is sent to their profile (precondition of UC-02). The service
first normalises the input, collapsing any spaces in the full name and stripping and lower-casing the
email address, the way log-in looks it up, and checks the fields of CO-02.1: a full name with a last
name, a well-formed email address, at most 255 characters each, and the password policy of A15 (at
least 10 characters, including a letter and a number; at most 72 bytes, which BCrypt reads). Every
invalid field comes back at once with its reason, so the form shows each one next to its field and
moves the focus to the first. Only then does the service look the address up and refuse it if an
account already exists, suggesting to log in instead. Otherwise it creates the Applicant as Active,
keeps only a hash of the password and saves it; the unique constraint on the email turns two
registrations at the same moment into the same refusal. No verification email is sent (A15):
LogInService signs a token for the new Applicant (ADR-0010), and the form saves the session and
opens the profile, where the Applicant is invited to add a resume (UC-03), or the posting the
visitor came from to apply (UC-04 extension 1a). Any other failure shows "Unable to create the
account. Please try again." (extension *a).

```mermaid
sequenceDiagram
    actor V as Visitor
    participant RF as RegisterForm
    participant RC as Registration<br/>Controller
    participant RS as Registration<br/>Service
    participant UR as UserRepository
    participant PE as PasswordEncoder
    participant LS as LogInService

    V->>RF: enter full name, email, password and submit
    RF->>RC: POST /api/applicants<br/>{fullName, email, password}
    RC->>RS: register(fullName, email, password)
    RS->>RS: normalise (spaces in the name, email stripped,<br/>lower-cased → address), validate fields:<br/>full name with a last name, email well formed,<br/>lengths, password policy (A15)

    alt invalid fields (ext. 4a, 4c)
        RS-->>RC: RegistrationRefusedException(fieldErrors)
        RC-->>RF: 400 {field: reason}
        RF-->>V: each reason next to its field, focus on the first,<br/>nothing saved
    else fields valid
        RS->>UR: findByEmailIgnoreCase(address)
        alt email already registered (ext. 4b)
            UR-->>RS: Optional<User> (present)
            RS-->>RC: AlreadyRegisteredException
            RC-->>RF: 409 "An account already exists…"
            RF-->>V: message shown, nothing saved
        else all checks pass
            UR-->>RS: Optional<User> (empty)
            create participant A as :Applicant
            RS->>A: new Applicant()
            RS->>A: setFirstName(..), setLastName(..), setEmail(address),<br/>setAccountStatus(ACTIVE)
            RS->>PE: encode(password)
            PE-->>RS: hash
            RS->>A: setPasswordHash(hash)
            RS->>UR: saveAndFlush(applicant)
            alt same email registered at the same moment (ext. 4b)
                UR-->>RS: DataIntegrityViolationException
                RS-->>RC: AlreadyRegisteredException
                RC-->>RF: 409 "An account already exists…"
                RF-->>V: message shown, nothing saved
            else saved
                UR-->>RS: Applicant
                RS->>LS: startSession(applicant)
                Note over LS: JwtEncoder signs the token (HS256):<br/>subject email, claim role=APPLICANT,<br/>issued now, expires in 8 h
                LS-->>RS: LoggedIn(token, applicant)
                RS-->>RC: LoggedIn
                RC-->>RF: 201 LoggedInResponse {token, user}
                RF->>RF: saveSession(session)
                RF->>RF: router.replace(next ? safeNext(next) : "/profile"),<br/>router.refresh()
                RF-->>V: logged in, invited to add a resume (UC-03),<br/>or back to the posting (UC-04 ext. 1a)
            end
        end
    end
```

**Figure 27: SD-8 Register as an applicant (UC-02)**

### UC-03 Update Applicant Profile

UC-03 is not built yet: SD-9 and SD-10 are its design for Iteration 3, in the shape of the code
that exists. The logged-in Applicant is the subject of the session token (ADR-0010); the
controller passes that email to the service, so an applicant can only ever read and change their own
profile (BR-15). CO-03.2 changes First Name, Last Name and phone #, the User attributes of the
domain model; the other profile fields of step 2 wait for the domain model to have them.

**SD-9.** The profile page asks for the profile, and the service reads the Applicant with the resume
on file, if any (CO-03.1). On save it checks the fields (a first and a last name, a well-formed
phone number) and returns every invalid one with its reason, so the page shows each next to its
field (extension 4a); otherwise it changes the Applicant and confirms the save (CO-03.2).

```mermaid
sequenceDiagram
    actor AP as Applicant
    participant PP as ProfilePage
    participant PC as ApplicantProfile<br/>Controller
    participant PS as ApplicantProfile<br/>Service
    participant AR as Applicant<br/>Repository
    participant A as :Applicant

    AP->>PP: open Profile & resume
    PP->>PC: GET /api/applicant/profile (bearer token)
    PC->>PS: viewProfile(email)
    PS->>AR: findByEmailIgnoreCase(email)
    AR-->>PS: Applicant, with its Resume if any
    PS-->>PC: Applicant
    PC-->>PP: 200 ProfileResponse {firstName, lastName,<br/>email, phone, resume {fileName, uploadDate}}
    PP-->>AP: the profile and the resume on file

    AP->>PP: edit first name, last name, phone and save
    PP->>PC: PUT /api/applicant/profile<br/>{firstName, lastName, phone}
    PC->>PS: updateProfile(email, details)
    PS->>PS: validate: first and last name present,<br/>phone well formed
    alt invalid fields (ext. 4a)
        PS-->>PC: ProfileRefusedException(fieldErrors)
        PC-->>PP: 400 {field: reason}
        PP-->>AP: each reason next to its field, nothing saved
    else fields valid
        PS->>AR: findByEmailIgnoreCase(email)
        AR-->>PS: Applicant
        PS->>A: setFirstName(..), setLastName(..), setPhone(..)
        PS->>AR: save(applicant)
        AR-->>PS: Applicant
        PS-->>PC: Applicant
        PC-->>PP: 200 ProfileResponse
        PP-->>AP: "Profile saved."
    end
```

**Figure 28: SD-9 Update applicant profile (UC-03)**

**SD-10.** The page sends the file as a multipart upload. The service accepts only a PDF or DOCX of
at most 5 MB and otherwise refuses it, keeping the current resume (extension 6a). An accepted file
becomes a new Resume with its name, type, size and upload date, stored in the database, and
replaces the Applicant's previous one: an applicant has at most one resume (BR-6). Applications
already submitted keep their own Resume Snapshot, so replacing the resume changes none of them
(FR-UC03.3, A6). No external malware scanner is used (Iteration 1 feedback).

```mermaid
sequenceDiagram
    actor AP as Applicant
    participant PP as ProfilePage
    participant PC as ApplicantProfile<br/>Controller
    participant PS as ApplicantProfile<br/>Service
    participant AR as Applicant<br/>Repository
    participant RR as Resume<br/>Repository
    participant A as :Applicant

    AP->>PP: choose a resume file and upload
    PP->>PC: POST /api/applicant/resume<br/>(multipart file, bearer token)
    PC->>PS: uploadResume(email, file)
    PS->>PS: check type (PDF or DOCX) and size (at most 5 MB)
    alt not a PDF or DOCX, or larger than 5 MB (ext. 6a)
        PS-->>PC: ResumeRefusedException(reason)
        PC-->>PP: 400 reason
        PP-->>AP: accepted types and size limit,<br/>current resume kept
    else file accepted
        PS->>AR: findByEmailIgnoreCase(email)
        AR-->>PS: Applicant
        create participant R as :Resume
        PS->>R: new Resume(fileName, fileType,<br/>fileSize, content, uploadDate = now)
        PS->>RR: save(resume)
        RR-->>PS: Resume
        PS->>A: setResume(resume)
        Note over A: the previous Resume is no longer the<br/>applicant's (BR-6), application snapshots unchanged (A6)
        PS->>AR: save(applicant)
        AR-->>PS: Applicant
        PS-->>PC: Resume
        PC-->>PP: 201 ResumeResponse {fileName, uploadDate}
        PP-->>AP: the new resume's file name and upload date
    end
```

**Figure 29: SD-10 Upload a resume (UC-03)**

## 7. Design Class Diagram (DCD)

Not written yet. Iteration 2 adds the design class diagram, consistent with the sequence diagrams
above and with the [domain model](domain-model.md).

### 7.1 Consistency with the sequence diagrams

Every system operation in a sequence diagram above, and the classes and methods that realize it;
the DCD must contain each of them.

| Diagram | Controller method | Service method | Repository calls |
| --- | --- | --- | --- |
| SD-1 | `JobPostingController.searchPostings`; `PublicPosting.of` | `JobPostingService.searchPostings`; `JobPosting.isOpen` | `JobPostingRepository.findByPostStatusAndApplicationDeadlineGreaterThanEqualOrderByDatePostedDescJobPostIdDesc` |
| SD-8 | `RegistrationController.register` | `RegistrationService.register`; `LogInService.startSession` | `UserRepository.findByEmailIgnoreCase`, `saveAndFlush` |
| SD-9 | `ApplicantProfileController.viewProfile`, `updateProfile` | `ApplicantProfileService.viewProfile`, `updateProfile` | `ApplicantRepository.findByEmailIgnoreCase`, `save` |
| SD-10 | `ApplicantProfileController.uploadResume` | `ApplicantProfileService.uploadResume` | `ApplicantRepository.findByEmailIgnoreCase`, `save`; `ResumeRepository.save` |
