# CareerBridge — Vision and scope

> Part of the CareerBridge specification — see the [index](README.md). Section numbers are those of the project documentation, so references such as "section 4.3" work across files.

## 1. Introduction

This document is the Iteration 1 analysis documentation for the Recruiting and Application Management System that team CareerBridge is building for CSI 5324. It records what the system must do: its requirements, use cases, system sequence diagrams, operation contracts, domain model and first userinterface drafts. Design and implementation in later iterations start from this agreed description of the problem.

The system is a multi-organization job board, similar in spirit to LinkedIn job listings. Many organizations publish job postings in one place, and job seekers browse them and apply to any organization with a single account and a single resume (BR-1).

Its users are applicants looking for work, recruiters who hire for one or more organizations, and a platform Administrator who approves recruiters, organizations and postings before they go public. Visitors who have not signed in can browse open postings.

Without a shared board, each organization runs its own hiring process: applicants re-enter the same details, lose track of where their applications stand and rarely learn why they were turned down. CareerBridge gives every organization the same fixed hiring pipeline, keeps applicants informed at every stage, closes postings automatically when they fill or expire, and keeps each organization's applications private from every other organization.

## 2. Project Overview

Seen from outside, CareerBridge offers the following capabilities. The use cases in section 4 describe each one in detail.

- Public browsing and search of open postings from all organizations (UC-01).

- Applicant self-registration, one profile and one resume per applicant (UC-02, UC-03).

- Applying, tracking application status, withdrawing and answering offers, within a limit of 5 active applications per applicant (UC-04 to UC-07).

- Recruiter and organization registration, and recruiters joining further organizations, each approved by the Administrator (UC-08 to UC-10).

- Job posting creation, approval by the Administrator and automatic expiry at the application deadline (UC-11 to UC-13).

- Screening applications through a fixed pipeline, recording interviews, and extending and revising offers (UC-14, UC-15).

The following are outside the scope of Iteration 1:

- Proposing interview times or collecting the applicant's confirmation; CareerBridge only records interviews already arranged (BR-12).

- Calendar attachments in interview notices.

- Onboarding paperwork and employment contracts after an offer is accepted.

- Limiting a recruiter to particular postings; every active recruiter of an organization works on all of its postings (A10).

- Suspending, reinstating or removing recruiter accounts, memberships or organizations after approval; a recruiter leaving an organization.

- Expiring unanswered offers automatically; a recruiter rejects them instead (UC-14).

- Editing a posting after it is published.

- Signing in through third-party accounts such as Google or LinkedIn.

### 2.1 Product Perspective

CareerBridge is a new, standalone web-based system; it does not replace or extend an existing product. Figure 1 shows its context. People reach it in four roles: a Visitor browses public postings, and Applicants, Recruiters and the Administrator are Visitors who have signed in to an account with that role. Two external systems act on it: the Notification Service, an external email system that delivers the notices CareerBridge composes, and the Scheduler, which starts the regular expiration run for postings whose deadline has passed.

Actors are outside the system and do none of its work: people act through CareerBridge, the Notification Service only delivers messages, and the Scheduler only signals that the expiration run is due. Everything inside the boundary, from applications and the hiring pipeline to approvals and posting expiry, is built by the team.

![Figure 1: System context: CareerBridge, its human actors and its two system actors](diagrams/fig-01-system-context-careerbridge-its-human-actors-and-i.png)

**Figure 1: System context: CareerBridge, its human actors and its two system actors**

### 2.2 Assumptions and Dependencies

The customer's Deliverable 0 answers (section 3.3) leave some behavior open. The team settled it with the working assumptions in Table 1, each tagged A-n; the use cases cite them where they apply, and the last column lists those use cases. The customer is asked to confirm them.

**Table 1: Working assumptions and the use cases that depend on them**

|**ID**|**Assumption**|**Used in**|
|---|---|---|
|A1|The Administrator approves job postings.|UC-11, UC-12|
|A2|Each posting has a number of openings (default 1); it is filled when accepted offers<br>equal that number.|UC-07, UC-11, UC-15|
|A3|When a posting is filled, its remaining active applications are rejected with the reason<br>"Posting closed." When a posting only expires, it stops accepting applications, but those<br>already submitted continue through the pipeline.|UC-05, UC-07, UC-13,<br>UC-15, Close Job Posting|
|A4|The Administrator approves a recruiter joining an additional organization.|UC-08 to UC-10|
|A5|An applicant cannot reapply to a posting they already applied to, including after<br>withdrawing.|UC-04, UC-06|
|A6|Each submitted application keeps a copy of the resume as it was at submission, so later<br>resume changes do not alter it (follows from BR-5 and BR-6).|UC-03, UC-04, UC-14|
|A7|An application is active while it is in Applied, Screening, Interview or Offer. Hired,<br>Rejected, Withdrawn and Offer Declined are terminal. Only active applications count<br>toward the limit in BR-4.|UC-04, UC-06, UC-07|
|A8|Stage changes are final. An application moves forward one stage at a time and is never<br>moved back, and a rejection cannot be reversed.|UC-14|
|A9|A posting can be saved as a Draft before it is submitted. The Administrator can return a<br>submitted posting for changes (Returned) or reject it (Rejected, final). Its application<br>deadline must be 1 to 90 days away when it is submitted. A posting whose deadline<br>passes before it is published is returned for a new deadline (UC-12) or marked Expired<br>(UC-13).|Close Job Posting|
|A10|Every active recruiter of an organization can see and act on all of that organization's<br>postings and the applications to them. "The posting's recruiters" means the active<br>recruiters of the organization that owns it.|UC-04 to UC-07, UC-14,<br>UC-15, Close Job Posting|
|A11|A rejection of an application in the Applied or Screening stage reaches the applicant by<br>the end of the organization's business day on which it is recorded. An advance to<br>Screening or Interview, and a rejection at the Interview or Offer stage, reach the<br>applicant within 4 business days. All other notices, including offers and interview<br>details, are sent within 1 minute. Business days are Monday to Friday in the<br>organization's time zone.|UC-02, UC-04, UC-05,<br>UC-07, UC-14, UC-15,<br>Close Job Posting|
|A12|Interview outcomes are recorded for the organization only. Applicants learn the result<br>through an offer (UC-15) or a rejection (UC-14, extension 5a).|UC-05, UC-14|
|A13|An application can have at most two interview rounds. A cancelled interview does not<br>count as a round.|UC-14|
|A14|An offer's response deadline defaults to 7 days, and the start date must follow it. A<br>recruiter may revise an unanswered offer, including its deadline, and the application<br>stays in Offer. After its deadline an offer can no longer be accepted, and it stays in Offer<br>until a recruiter rejects it (UC-14, extension 5a).|UC-07, UC-15|
|A15|New accounts verify their email address through a link valid for 24 hours. Passwords<br>have at least 10 characters, including a letter and a number. Five failed log-ins within 15<br>minutes lock the account for 15 minutes.|UC-02, Log In|
|A16|A recruiter acts for one organization at a time and switches between Active<br>memberships.|UC-14, Log In|
|A17|A recruiter request whose work-email domain differs from the organization's website<br>domain is flagged for the Administrator's closer review.|UC-08|
|A18|Withdrawals and rejections record a reason chosen from a fixed list, plus an optional<br>comment. The system itself uses the reason "Posting closed."|UC-05, UC-06, UC-14|

The system depends on the following:

- An external email service, the Notification Service, delivers every notice: verification links, stage changes, interview details, offers and approval decisions. If it is unavailable, CareerBridge keeps the decision recorded and holds the notice until the service accepts it.

- A scheduler starts the posting expiration run at least every 15 minutes (UC-13).

- The platform: a backend written in Java on Spring Boot and a web frontend written in TypeScript on Next.js ([ADR-0001](adr/0001-spring-boot-and-nextjs.md)). Users reach CareerBridge through current desktop and mobile web browsers.

- Deadlines and business days are interpreted in each organization's time zone (A11, UC-13).
