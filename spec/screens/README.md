# Screen mockups

> Part of the CareerBridge specification — see the [index](../README.md). This folder holds what
> each screen looks like, and the catalog of screens below: which role reaches which address, for
> which use case.

One mockup per screen, named by its **screen ID**: `<role>-<screen>.html`, with its picture
`<role>-<screen>.jpg` beside it. Each mockup shows the screen at the three widths of
[ADR-0004](../adr/0004-frontend.md) side by side: phone 390 px, tablet 820 px, laptop 1440 px. All
of them share `cb.css`, the `careerbridge` theme redrawn for mockups. Open a mockup in a browser to
see it; read its HTML for the exact blocks and wording.

[ADR-0011](../adr/0011-screens-are-built-from-mockups.md) says how the mockups are used.

## The screen ID

The ID names a screen everywhere: the file names here, the catalog
([Screens by role](#screens-by-role)), a ticket's `Screen:` line and a pull request's `## Screens`. The
page that draws a screen is the Next.js page of its address: `/applications/{id}` is
`app/frontend/src/app/applications/[id]/page.tsx`. Where two roles share an address (`/`, `/jobs`,
`/jobs/{id}`), one page draws both screens and chooses by the role of the logged-in user.

## What a mockup fixes and what it does not

- **Fixes:** which blocks the screen has, their order and place at each width, the wording, the
  main action, the navigation of the role.
- **Does not fix:** the code. Pages are built from the theme and the blocks on `/styleguide`, not
  from `cb.css`. A block in the mockup that `/styleguide` lacks becomes a component in
  `src/components/` and an entry on `/styleguide` first.
- **Shows every state.** A mockup draws the main state with one example, such as an application
  at Offer, and each extension's message or dialog as a separate block marked "When …", worded as
  in the use case.
- **Names and dates are examples.** Real data comes from the backend.
- **Exactly the specification.** Every block of a mockup traces to a use case step or extension,
  an FR, a business rule or an assumption, and every state they name is drawn. Something more is
  added to the specification first.

## Changing a screen

A screen changes in the pull request that changes its page:

1. Edit `<id>.html` (and `cb.css` only for a block that is new to every screen).
2. Redraw its picture: `cd app/frontend && npm run mockups -- <id>` (no ID redraws all).
3. If the address, role, use cases or hand-offs change, change the catalog
   ([Screens by role](#screens-by-role)) too.

A new screen gets a new ID, a mockup and a row in the catalog before its page is coded. A change
that touches other roles' screens or the navigation is agreed with the team first.

The mockups were first drawn on a Claude Design canvas on 29 October 2026; that canvas is no longer
kept up to date. These files are the reference.

## Screens by role

This catalog fixes how the site is organized around the actors: what each one sees after logging in, which screens they reach, and
where each use case and each hand-off between use cases lives. It is the catalog of screens: each
screen has an ID, and its mockup at the three widths of [ADR-0004](../adr/0004-frontend.md) is
`<ID>.html`, with a picture beside it (this folder). A page is built to
match its mockup, and a screen that is not listed here is added before it is coded
([ADR-0011](../adr/0011-screens-are-built-from-mockups.md)).

**Principles**

1. **One workspace per role.** The header, the navigation and the home page are chosen by the
   role of the logged-in user: Visitor, Applicant, Recruiter, Administrator, plus a recruiter whose
   request is still pending. Nobody sees another role's entries.
2. **Nothing beyond the specification.** A screen shows what a use case step, an FR, a business
   rule or an assumption asks for, and nothing the system would have to compute or store besides:
   no dashboards, counts, badges or reminders that no requirement names. A feature the team wants
   later is added to the specification first, then to the mockup. The one exception is the
   summary cards of principle 3.
3. **Home is a short list of the role's actions**, as in the wireframes above: each one a link to
   its use case. Above them, a few summary cards count lists the role already sees on another
   screen and link there; with no answer from the backend a card shows no number
   ([ADR-0013](../adr/0013-home-summary-cards.md)).
4. **Every use case has one place, and every hand-off is a link** (table "Hand-offs" below).
5. **A screen of another role is closed, not only hidden.** A logged-in user who opens another
   role's address sees only a notice that names their role, with nothing of that page; a visitor
   is asked to log in and comes back after it. The job
   board stays open to everyone (UC-01 serves all actors through generalization), but only the
   Visitor and the Applicant have it in their navigation.
6. **Final actions are confirmed.** Withdraw, accept, decline, reject an application, reject a
   posting and deny a request open a dialog that says what cannot be undone (BR-5, BR-13, A5, A8).
7. **Every application, posting and request has its own address**, so a notice or a colleague can
   point straight to it (UC-05, technology variation 1a).
8. **A recruiter works in one organization at a time.** The organization switcher sits in the
   header, and every recruiter screen shows only that organization's data (UC-09 special
   requirements, A16, BR-15).
9. **The phone dock holds at most four entries.** Rare actions live in the account menu.
10. **No images.** No organization logos or initials and no illustrations: the specification lets
   an organization upload a logo (UC-08, technology variation 3a) but shows it nowhere.
11. **Every state the specification names is drawn.** Besides the main state, a mockup shows each
   extension's message or dialog as a separate block marked "When …", with the wording of the use
   case.
12. **Waiting, empty and messages look the same everywhere.** While a screen loads a list itself, the
   list's place shows gray placeholder cards and a line saying what is loading (`Loading`). An empty list
   says so in a card with the inbox icon (`EmptyState`). Every message carries the icon of its
   kind: note, success, warning or error. They are drawn once on `/styleguide`; a mockup shows the
   loading state only where the screen loads its list itself (`recruiter-postings`).

**Navigation**

| Role | Home after log in | Navigation (side column, tiles, phone dock) | Header |
| --- | --- | --- | --- |
| Visitor | `/` front page | none: the content takes the full width | Log in, Register |
| Applicant | `/` home | Home · Find jobs · Applications · Profile | Account menu |
| Recruiter, pending | `/recruiter/status` | none | Account menu (Log out) |
| Recruiter | `/recruiter` | Home · Postings · Organizations | Organization switcher, account menu |
| Administrator | `/admin` | Home · Posting approvals · Recruiter requests · Users | Account menu |

**Visitor**

| ID | Address | Screen | Use cases | Holds and leads to |
| --- | --- | --- | --- | --- |
| [`visitor-home`](visitor-home.html) | `/` | Front page | UC-01, UC-02, UC-08 | Search box (keywords and location) and two ways in: "Looking for a job" (UC-02) and "Hiring" (UC-08). |
| [`visitor-jobs`](visitor-jobs.html) | `/jobs` | Job board | UC-01 | Keywords, location, organization and employment type; results newest first; the empty texts of extensions 2a and 2b; the criteria kept after a failure (\*a). |
| [`visitor-posting`](visitor-posting.html) | `/jobs/{id}` | Posting | UC-01, UC-04 1a | Every detail of the posting. Apply leads to Log In or Register and back to this posting. |
| [`visitor-register`](visitor-register.html) | `/register` | Register as applicant | UC-02 | Name, email, password with the policy shown. Done: the Profile with an invitation to add a resume. Link "Hiring? Register your organization" (1a). |
| [`visitor-recruiter-register`](visitor-recruiter-register.html) | `/recruiter/register` | Register recruiter and organization | UC-08 | Two parts, "You" and "Your organization". A known organization offers a membership request instead (4c). Done: "Check your email", then the request status. |
| [`visitor-login`](visitor-login.html) | `/login` | Log In | Log In | Returns to the page that sent the user here, or to the role's home. Link "Forgot password?". |
| [`visitor-forgot-password`](visitor-forgot-password.html) | `/forgot-password` | Forgot password | Log In | Email only. Done: "Check your email", the same whether or not the account exists; in a demonstration the link itself. |
| [`visitor-reset-password`](visitor-reset-password.html) | `/reset-password?token=…` | Choose a new password | Log In | New password with the policy shown. Done: "Your password is changed" and Log in. A link that no longer works offers a new one. |

**Applicant**

| ID | Address | Screen | Use cases | Holds and leads to |
| --- | --- | --- | --- | --- |
| [`applicant-home`](applicant-home.html) | `/` | Home | UC-01, UC-05, UC-03 | Summary cards: active applications "N of 5" and offers to answer, both to Applications. The applicant's actions: Find jobs (UC-01), My applications (UC-05, with UC-06 and UC-07 on each application), Profile and resume (UC-03). |
| [`applicant-jobs`](applicant-jobs.html) | `/jobs` | Job board | UC-01 | As for the Visitor, inside the applicant's navigation. |
| [`applicant-posting`](applicant-posting.html) | `/jobs/{id}` | Posting | UC-01, UC-04 | As for the Visitor. Apply leads to the Apply page, which says why when applying is not possible (UC-04 2b, 4c). |
| [`applicant-apply`](applicant-apply.html) | `/jobs/{id}/apply` | Apply | UC-04 | Posting, contact details, resume on file with "Update resume" (3a), "3 of 5 active", the note that an application cannot be edited (BR-5), Submit. The blocked cases 1c, 2a, 2b and 4c each say what to do next. Done: "4 of 5 active" and a link to the new application. |
| [`applicant-applications`](applicant-applications.html) | `/applications` | Applications | UC-05 | Every application, active ones first, each with its submission date, stage and date of the last change; an optional filter All / Active / Closed (2b); "N of 5 active". None yet: a link to the job board (2a). |
| [`applicant-application`](applicant-application.html) | `/applications/{id}` | Application | UC-05, UC-06, UC-07 | Posting and current stage; the stage history with dates and interview details, never outcomes (A12); the rejection reason (4a, 4b) or withdrawal date (4c). At Applied, Screening or Interview: Withdraw, with a reason from the list of A18. At Offer: the terms, the deadline, Accept and Decline (UC-07); after the deadline only the terms. |
| [`applicant-profile`](applicant-profile.html) | `/profile` | Profile and resume | UC-03 | Profile details form; the resume card with file name, upload date and Replace; the accepted types and size (6a). |

There is no separate Offers screen. An offer is the Offer stage of an application (UC-05 5b), so it
is shown on that application's page; the desk and the Applications entry point to it.

**Recruiter**

| ID | Address | Screen | Use cases | Holds and leads to |
| --- | --- | --- | --- | --- |
| [`recruiter-status`](recruiter-status.html) | `/recruiter/status` | Request status | UC-08 \*a, BR-14 | For a recruiter without an Active membership: the request's state (email not verified, under review, information requested, denied with reason). Nothing else is reachable. |
| [`recruiter-home`](recruiter-home.html) | `/recruiter` | Home | UC-11, UC-14, UC-09 | Summary cards for the current organization: postings Published, Pending approval and Returned, each to Postings. The recruiter's actions for the current organization: New posting (UC-11), Postings and their applicants (UC-11, UC-14, UC-15), Organizations (UC-09). Until `/recruiter` is built, `/` shows the cards above the open postings. |
| [`recruiter-postings`](recruiter-postings.html) | `/recruiter/postings` | Postings | UC-11, UC-14 step 2 | Every posting of the organization with its status; a Published or Closed posting with the number of applications at each stage (FR-UC14.1), leaving out a stage with none unless every stage has none. New posting. Revise a Returned posting and Continue a Draft (UC-11 3b, 6a); Close a Published posting, after a confirmation that it cannot be undone (UC-13 \*a). |
| [`recruiter-posting-form`](recruiter-posting-form.html) | `/recruiter/postings/new`, `/recruiter/postings/{id}/edit` | Posting form | UC-11 | "Posting for: organization"; start from an earlier posting (3a); Save draft (3b) or Submit for approval. On a Returned posting, the Administrator's comments above the form (6a). |
| [`recruiter-posting`](recruiter-posting.html) | `/recruiter/postings/{id}` | Posting and its applicants | UC-14, UC-11 | Status, and the public page when Published. Applicants by active stage: Applied, Screening, Interview, Offer, with counts. Choose several and advance them together (5d). None yet: 3a. |
| [`recruiter-review`](recruiter-review.html) | `/recruiter/applications/{id}` | Application review | UC-14, UC-15 | The resume copy (A6), the applicant's profile details, this application's stage history with its internal notes, and nothing about the applicant's other applications (BR-15). The main action follows the stage: Move to Screening, Move to Interview, Extend offer at Interview, Revise offer at Offer; an advance takes an optional internal note (step 5). Record an interview at Interview, and its outcome once it has taken place, at most two rounds (A13). Reject at any active stage, with a reason and a comment for the applicant, warning at Offer that the offer is rescinded. |
| [`recruiter-offer`](recruiter-offer.html) | `/recruiter/applications/{id}/offer` | Offer | UC-15 | Job title from the posting; openings, accepted and outstanding offers; the warnings 2a and 2b; start date, compensation, other terms, deadline (7 days by default), letter; a preview as the applicant will see it; Send. |
| [`recruiter-organizations`](recruiter-organizations.html) | `/recruiter/organizations` | Organizations | UC-09 | Memberships with their status; cancel a pending request (\*a); Join an organization: search, summary, role and justification. |

**Administrator**

| ID | Address | Screen | Use cases | Holds and leads to |
| --- | --- | --- | --- | --- |
| [`admin-home`](admin-home.html) | `/admin` | Home | UC-12, UC-10 | Summary cards: postings to review, recruiter requests waiting and users, each to its screen. The Administrator's actions: Posting approvals (UC-12) and Recruiter requests (UC-10). Until `/admin` is built, `/` shows the cards above the open postings. |
| [`admin-postings`](admin-postings.html) | `/admin/postings` | Posting approvals | UC-12 | Oldest first: title, organization, recruiter, submission date, deadline. On a laptop the list and the chosen posting side by side; on a phone the list opens the posting. |
| [`admin-posting`](admin-posting.html) | `/admin/postings/{id}` | Posting review | UC-12 | The posting as the public will see it, drawn by the same component as `/jobs/{id}` (technology variation 4a), and the organization's status. Approve, Return with comments, Reject with a reason. After a decision: back to the queue (step 8). The blocked cases 6a and 6b say why. |
| [`admin-requests`](admin-requests.html) | `/admin/requests` | Recruiter requests | UC-10 | Oldest first: request type (new organization, joining an existing organization, an additional organization), requester, organization, date, review flag. |
| [`admin-request`](admin-request.html) | `/admin/requests/{id}` | Request review | UC-10 | Requester (name, work email, job title, memberships), organization with a link to its website (5a), justification. Approve, Deny with a reason, Ask for information; for a duplicate organization, approve the membership in the existing one (5c). |
| [`admin-users`](admin-users.html) | `/admin/users` | Users | Administration (FR-ADM.1, FR-ADM.2) | Every user with their name, email, role and account status, and the number of users in each role. Deactivate on an active recruiter, Reactivate on a deactivated one (FR-ADM.2). |

UC-13 Expire Job Posting has no screen: its results appear as Closed · Expired and Expired on the
recruiter's postings and home.

**Hand-offs**

| From | To | Where |
| --- | --- | --- |
| UC-01 posting | UC-04 Apply | Apply on `/jobs/{id}` |
| UC-02 done | UC-03 | The Profile, inviting a resume |
| UC-02 1a | UC-08 | "Hiring? Register your organization" |
| UC-04 2a, 3a | UC-03, then back to UC-04 | "Add resume" or "Update resume" returns to the same Apply page |
| UC-04 done | UC-05 | Link to the new application |
| UC-05 | UC-06, UC-07 | Actions on `/applications/{id}` |
| UC-06 4a | UC-07 | The offer on the same application page |
| UC-08 4b | Log In, UC-09 | "You already have an account" |
| UC-12 5a | UC-11 6a | The Returned posting on the recruiter's home and Postings |
| UC-14 | UC-15 | Extend offer on the application review |
| UC-15 1a | UC-14 | Back to the application review |
