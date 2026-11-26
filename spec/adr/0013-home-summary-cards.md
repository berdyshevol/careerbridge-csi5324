# ADR-0013: A role's home shows a few counts it already has

- **Status:** Accepted
- **Date:** 2026-11-26
- **Amends:** the principles "Nothing beyond the specification" and "Home is a short list of the
  role's actions" in [spec/screens/README.md](../screens/README.md)

## Context

The homes were lists of links. For the final presentation the team wanted each home to say at a
glance what waits for the person, without inventing data or dashboards the specification does not
ask for. Zeba (PM) agreed the change for the team on November 26 (SCRUM-244).

## Decision

1. **Only counts the system already shows elsewhere.** Each card counts a list that another screen
   of the same role already shows, from the same backend call, and links to that screen:
   - Applicant: active applications against the limit of 5 (BR, as on Apply and Applications) and
     applications at the Offer stage (UC-05, UC-07); from `viewApplications`.
   - Recruiter: the organization's postings that are Published, Pending approval and Returned
     (UC-11, UC-12 6a); from `viewRecruiterPostings`.
   - Administrator: postings waiting for review (UC-12), recruiter requests waiting (UC-10) and
     users (FR-ADM.1); from `openPostingApprovalQueue`, `openRecruiterRequestQueue`, `viewUsers`.
2. **No number without data.** When the backend does not answer, a card says "Not available" and
   shows no number. Nothing is stored or computed for the cards alone.
3. **The cards sit above the role's actions**, which stay as they were. One block,
   `SummaryCards` in `src/components/`, draws them for every role.

## Consequences

- The home asks the backend for data, so it renders a little later than a list of links.
- A new card needs a list that some screen already shows; anything else goes into the
  specification first.
