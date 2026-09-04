# CSI 5324 — Deliverable 0: Team Formation

> **Source of truth.** This file is the canonical record of Deliverable 0.
> The team-facing surface is the [Google Doc](https://docs.google.com/document/d/15zd5QDdhedyz-L5WIdtdP7zIEUdCRm77v3wfbVkTK2k/edit) (used during the team call); changes made here should be synced back to it before submission.
>
> Assignment: [assignment.md](assignment.md) · Due: **Thu Sep 3, 2026, 11:59pm** · Submission: PDF or DOCX on Canvas

**DECIDED — Scope:** multi-company job board (**LinkedIn-like**): many organizations post jobs; applicants browse and apply across companies.

## 1. Team name

**CareerBridge**

## 2. Role assignments

One or two ownership roles each. All members also serve as developers/testers, each owning **at least 3 use cases** end-to-end (analysis → design → implementation → unit testing).

| Role | Assigned to |
| --- | --- |
| Project Manager | Zeba Tusnia Towshi |
| Requirements Engineer | Rabeya Nazara |
| Design Engineer | Josh Job Joseph |
| Quality Assurance Engineer | Reagan Rubio |
| Project Librarian | Oleg Berdyshev |

## 3. Requirements clarification questions

### Scope & business model

1. Is the system for a single organization's internal recruiting, or a multi-company job board where many organizations post jobs?
   - **Answer:** Multi-organization, similar to LinkedIn.
2. Can one recruiter belong to multiple organizations?
   - **Answer:** Yes.
3. Should the public (not-logged-in visitors) be able to browse job postings, or is everything behind a login?
   - **Answer:** Some pages are public.

### Applicant experience

4. Can an applicant apply to multiple jobs at once? Is there a limit on active applications?
   - **Answer:** Yes; limit of 5 active applications.
5. Can an applicant withdraw or edit an application after submitting it?
   - **Answer:** They can withdraw but not edit it.
6. One resume per applicant, or multiple resumes/cover letters tailored per application?
   - **Answer:** One resume.
7. What should an applicant see about their application status — every internal stage, or only coarse outcomes (received / in review / interview / offer / rejected)?
   - **Answer:** All stages.

### Recruiter workflow

8. What are the stages of the recruiting pipeline (e.g., applied → screening → interview → offer → hired/rejected)? Is the pipeline fixed or configurable per job?
   - **Answer:** Fixed pipeline.
9. Do job postings need an approval step before going live, and do they expire (deadline, auto-close when filled)?
   - **Answer:** Yes, an approval step is needed, and postings do expire.
10. Should rejected applicants be notified automatically? Are rejection reasons recorded and/or shared?
    - **Answer:** Yes (automatic notification) and yes (reasons recorded/shared).
11. Should interview coordination happen inside the system — e.g., the recruiter proposes interview times and the applicant confirms — or is it enough to record that an interview was scheduled and its outcome?
    - **Answer:** It is enough to record that an interview was scheduled.
12. What happens at the successful end of the process: is an offer extended and accepted/declined through the system, and should a job posting close automatically once it is filled?
    - **Answer:** Yes; the job posting should automatically close to save on memory and time for other potential applications.

### Administration & privacy

13. Who creates and approves new recruiter/organization accounts — the Administrator? Is applicant self-registration open?
    - **Answer:** Applicants can self-register. Recruiter/organization accounts require Administrator approval.
14. Are there privacy expectations we should honor (e.g., company A can't see applications to company B; recruiters can't see an applicant's other applications)?
    - **Answer:** Yes. Recruiters should only have access to applications submitted to jobs within their own organization. They should not be able to view an applicant's applications to other organizations.

## 4. Backend language (team poll)

JavaScript, Node.js

> ⚠️ Open issue: the course requires the project to be **Maven-based and JUnit-tested** (see [requirements/group-project-overview.md](../../requirements/group-project-overview.md)), which effectively assumes Java. A Node.js backend needs a documented technical rationale in Iteration 1 and, ideally, Dr. Ren's approval.
