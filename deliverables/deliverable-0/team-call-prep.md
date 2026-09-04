# Team Call Prep — Deliverable 0 (due Wed Sep 3, 11:59pm)

> **ARCHIVED** — pre-call agenda for the Sep 2, 2026 team call, kept as a meeting artifact.
> Outcomes are recorded in [deliverable-0.md](deliverable-0.md) (source of truth); statements below may be outdated (e.g., the backend was since approved to be Node.js).

Goal of the call: finalize the Deliverable 0 document — (1) team name, (2) role assignments, (3) the 14 requirements clarification questions below (Q1 already answered).

Working surfaces:
- Google Doc (submission draft): <https://docs.google.com/document/d/15zd5QDdhedyz-L5WIdtdP7zIEUdCRm77v3wfbVkTK2k/edit>
- Claude workspace (live answers + backend poll): <https://claude.ai/code/artifact/7565f63d-5bc6-4168-90a6-ba47595abc6c>

## Decided

- **Scope: multi-company job board (LinkedIn-like)** — many organizations post jobs; applicants browse and apply across companies.

## A. Decisions to make on the call

1. **Team name** — short and professional; it goes on every deliverable.
2. **Roles** (one or two ownership roles each; everyone still develops and owns ≥3 use cases end-to-end; commit history is graded):
   - Project Manager · Requirements Engineer · Design Engineer · QA Engineer · Project Librarian
   - With 4 members, someone doubles up.
3. **Backend language poll** (in the workspace artifact): Java (Spring Boot) / JavaScript (Node) / TypeScript (Node) / Python.
   - Constraint: the course requires the project to be **Maven-based and JUnit-tested** — effectively Java; JS/TS/Python needs a documented rationale in Iteration 1 (and ideally Dr. Ren's approval).
4. Logistics: meeting cadence + channel; GitHub usernames (add everyone to the repo); issue tracker (GitHub Issues recommended); who exports the doc to PDF and submits on Canvas.

## B. Final submission questions (14)

Q1 goes in with our answer; Q2–Q14 are open questions for the customer.

### Scope & business model
1. Single organization's internal recruiting, or a multi-company job board where many organizations post jobs?
   **Our answer:** multi-company job board (LinkedIn-like).
2. Can one recruiter belong to multiple organizations?
3. Should the public (not-logged-in visitors) be able to browse job postings, or is everything behind a login?

### Applicant experience
4. Can an applicant apply to multiple jobs at once? Is there a limit on active applications?
5. Can an applicant withdraw or edit an application after submitting it?
6. One resume per applicant, or multiple resumes/cover letters tailored per application?
7. What should an applicant see about their application status — every internal stage, or only coarse outcomes (received / in review / interview / offer / rejected)?

### Recruiter workflow
8. What are the stages of the recruiting pipeline (e.g., applied → screening → interview → offer → hired/rejected)? Is the pipeline fixed or configurable per job?
9. Do job postings need an approval step before going live, and do they expire (deadline, auto-close when filled)?
10. Should rejected applicants be notified automatically? Are rejection reasons recorded and/or shared?
11. Should interview coordination happen inside the system — e.g., the recruiter proposes interview times and the applicant confirms — or is it enough to record that an interview was scheduled and its outcome?
12. What happens at the successful end of the process: is an offer extended and accepted/declined through the system, and should a job posting close automatically once it is filled?

### Administration & privacy
13. Who creates and approves new recruiter/organization accounts — the Administrator? Is applicant self-registration open?
14. Are there privacy expectations we should honor (e.g., company A can't see applications to company B; recruiters can't see an applicant's other applications)?

## C. Not in the submission (ask Dr. Ren directly / decide internally)

- Email vs. in-app notifications (technical — decide in Iteration 1)
- Is an AI feature expected for a top grade, or purely optional? Oversight requirements if we add AI screening?
- How many use cases total is reasonable (members × 3 minimum)?
- Will the "customer" be Dr. Ren throughout the semester?
- The Overview's AI policy says extra rules "can be found here" but there's no link on the Canvas page — where does the AI-use policy live?

## D. After the call

1. Fill in team name + role table in the Google Doc.
2. Export to PDF/DOCX → submit on Canvas before **Sep 3, 11:59pm**.
3. Add all members to the GitHub repo and issue tracker.

---

Review note: the 14-question list passed an independent coverage check against the problem statement — it covers all explicitly listed responsibilities of the Applicant, Recruiter/HR, and Administrator roles; interview coordination (Q11) and offer/closing (Q12) were added specifically to close the gaps that check found.
