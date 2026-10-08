# CareerBridge — Domain model

> Part of the CareerBridge specification — see the [index](README.md). Section numbers are those of the project documentation, so references such as "section 4.3" work across files.

## 5. Domain Model (Analysis)

Figure 25 shows CareerBridge's conceptual classes, their attributes and the associations between them, with multiplicities. It models what exists in the job-board domain: users in their three roles, organizations and memberships, job postings, applications with their resume copy and history, interviews, offers and notifications. The operation contracts in section 4.3 are written with these class and attribute names.

![Figure 25: CareerBridge domain model](diagrams/fig-25-careerbridge-domain-model.png)

**Figure 25: CareerBridge domain model**

### 5.1 Classes and attributes

The same model as Figure 25, as text. This section is what code and tickets refer to; names are
spelled exactly as in the figure.

| Class | Attributes |
| --- | --- |
| User | userId, First Name, Last Name, email, phone #, account Status |
| Applicant | none of its own (a kind of User) |
| Recruiter | none of its own (a kind of User) |
| Administrator | none of its own (a kind of User) |
| Resume | resumeId, file Name, file Type, file Size, upload Date |
| Organization Membership | membershipId, status, requested at, approved at |
| Organization | organizationId, name, organization Status, website, description |
| Job Posting | jobPostId, title, description, location, applicationDeadline, postStatus, date posted, numberOfOpenings, salaryRange, approvalStatus, approvedBy, approvedAt, employmentType, jobRequirements |
| Application | applicationId, dateApplied, applicationStatus, rejectionReason, withdrawnAt, resumeSnapshot, statusHistory |
| Offer | offerId, dateExtended, expirationDate, status, responseDate, salary |
| Interview | interviewId, scheduledTime, outcome, notes |
| Notification | notificationId, type, message, sentAt, status |

### 5.2 Generalization

Applicant, Recruiter and Administrator are specializations of User.

### 5.3 Associations

Multiplicities are read as "one A is linked to … B".

| From | Multiplicity | To | Multiplicity | Meaning |
| --- | --- | --- | --- | --- |
| Notification | * | User | 1 | A notification is addressed to one user; a user has many notifications. |
| Applicant | 1 | Resume | 1 | An applicant creates and manages one resume. |
| Recruiter | 1 | Organization Membership | * | A recruiter has a membership for each organization they recruit for. |
| Organization Membership | * | Organization | 1 | Each membership is in one organization. |
| Organization | 1 | Job Posting | * | A job posting belongs to one organization. |
| Recruiter | 1 | Job Posting | * | A job posting is created by one recruiter. |
| Job Posting | 1 | Application | * | An application is for one job posting. |
| Resume | 1 | Application | 1 | An application is associated with the applicant's resume. |
| Application | 1 | Offer | 0..1 | An application has at most one offer. |
| Application | 1 | Interview | * | An application has any number of interviews. |

There is no direct association between Applicant and Application: an application reaches its
applicant through the resume.

### 5.4 Notes on the figure

- The Organization Membership box in the figure also shows a line "+ item: attribute". It is a
  leftover of the drawing tool, not an attribute, and is left out above.
- The figure draws Resume 1 — 1 Application. An applicant has one resume and up to five active
  applications (BR-4), so in the design one resume is associated with many applications. The
  design class diagram (section 7) records this.
