# Team Call Prep — Deliverable 0 (due Wed Sep 3, 11:59pm)

Goal of the call: leave with everything needed to write the Deliverable 0 document — (1) team name, (2) role assignments, (3) a list of requirements clarification questions for the "customer" (Dr. Ren).

## A. Decisions we must make on the call

### 1. Team name
- Pick something short and professional (it will be on every deliverable).

### 2. Role assignments (one or two ownership roles each; everyone still develops)
- **Project Manager** — who is organized and comfortable being the liaison with Dr. Ren?
- **Requirements Engineer** — leads Iteration 1 (Week 6), so heaviest workload first.
- **Design Engineer** — leads Iteration 2; UML/architecture experience helps.
- **Quality Assurance Engineer** — owns test strategy, JUnit, validation of requirements/design.
- **Project Librarian** — meeting logs, artifact organization, likely owns the team website later.
- If we have 4 members, who doubles up? (5 roles, 4–5 members.)
- Reminder: **every member must own ≥3 use cases** end-to-end (analysis → design → implementation → unit testing). Commit history is graded, so work must be visibly distributed.

### 3. Logistics (worth settling now, not part of the submission)
- Weekly meeting time + communication channel (Discord/Slack/iMessage?).
- Git hosting: GitHub or GitLab? (Must be used **from the beginning**.) Everyone's usernames for collaborator invites.
- Issue tracker: GitHub Issues / Jira / Trello?
- Do we stick with the given project (Recruiting & Application Management System) or propose our own idea? (Own idea requires Dr. Ren's approval + extra problem statement — recommend sticking with the given one.)
- Tech stack: recommended is Spring Boot + React + PostgreSQL/MySQL + JUnit + GCP. Note the project **must be Maven-based and JUnit-tested** regardless. Any deviation needs a documented rationale in Iteration 1.
- Who submits Deliverable 0 on Canvas, and who converts our doc to PDF/DOCX?

## B. Requirements clarification questions (for the submission)

The assignment asks for **non-technical questions needing the user's/customer's clarification**. Draft list to review, trim, and prioritize on the call:

### Scope & business model
1. Is the system for a **single organization's** internal recruiting, or a **multi-company job board** (like LinkedIn/Indeed) where many organizations post jobs?
2. If multi-company: can one recruiter belong to multiple organizations? Who creates an organization?
3. Should the public (not-logged-in visitors) be able to browse job postings, or is everything behind a login?

### Applicant experience
4. Can an applicant apply to multiple jobs at once? Is there a limit on active applications?
5. Can an applicant withdraw or edit an application after submitting it?
6. Should applicants be able to save/bookmark jobs and get notified about new matching postings?
7. One resume per applicant, or multiple resumes/cover letters tailored per application?
8. What should an applicant see about their application status — every internal stage, or only coarse outcomes (received / in review / interview / offer / rejected)?

### Recruiter workflow
9. What are the stages of the recruiting pipeline (e.g., applied → screening → interview → offer → hired/rejected)? Is the pipeline fixed or configurable per job?
10. Do job postings need an approval step before going live, and do they expire (deadline, auto-close when filled)?
11. How are interviews coordinated — does the recruiter propose time slots and the applicant picks one? Do we need calendar-style scheduling?
12. Should rejected applicants be notified automatically? Are rejection reasons recorded and/or shared?
13. Can multiple recruiters from the same organization work on the same job posting?

### Communication & notifications
14. Do applicants and recruiters need in-app messaging, or are status changes/notifications enough?
15. Should the system send email notifications, or are in-app notifications sufficient for this project?

### Administration & policy
16. Who approves new recruiter/organization accounts — the Administrator? Is applicant self-registration open?
17. What data should be retained when an account is deleted (applications, decisions, logs)?
18. Are there privacy expectations we should honor (e.g., recruiters can't see an applicant's other applications; applicants can't see each other)?

### AI features (optional per problem statement)
19. Is an AI feature (resume parsing, job matching, interview question generation) expected for a top grade, or purely optional?
20. If we include AI matching/screening, what level of human oversight is required before an AI recommendation affects an applicant?

### Process questions (for Dr. Ren, non-requirements)
21. How many use cases total is a reasonable scope for a team of our size (N members × 3 minimum)?
22. Will the "customer" for requirements clarification be Dr. Ren throughout the semester?

## C. After the call — to produce the submission

1. Fill in: team name, member ↔ role table, final question list (numbered, grouped).
2. Export to **PDF or DOCX** and submit on Canvas before **Sep 3, 11:59pm**.
3. Add all members to the GitHub repo and the issue tracker.
