# CareerBridge — User Manual

> Part of the CareerBridge specification — see the [index](README.md).

## 12. User Manual

How to use CareerBridge from the point of view of each kind of user. Each section lists what the
role can do and walks through its typical workflows. Menu entries, page titles and buttons are
written in **bold**, exactly as the application shows them.

### 12.1 Getting started

**Where.** Open <https://careerbridge-csi5324.vercel.app> in any modern browser, on a phone, a
tablet or a laptop. The server sleeps when nobody uses it. On the first visit a page may say
"The server is not answering yet" for a minute or more while it wakes up; it tries again by
itself, so wait and do not reload.

**Who.** CareerBridge has four kinds of users:

| User | What they do |
| --- | --- |
| Visitor | Anyone without an account: searches open jobs and registers. |
| Applicant | Keeps a profile and a resume, applies for jobs, follows the applications, withdraws, answers offers. |
| Recruiter | Works for an approved organization: writes job postings, sends them for approval, closes them, joins more organizations. |
| Administrator | Approves job postings and new recruiters and organizations, sees all users. |

**Demo accounts.** Every demo account uses the password `Baylor@2026`.

| Role | Email |
| --- | --- |
| Administrator | admin@careerbridge.example |
| Recruiter | riley.chen@example.com, recruiter1@example.com … recruiter6@example.com |
| Applicant with three applications | jordan.lee@example.com |
| Applicant with none | sam.rivera@example.com, applicant1@example.com … applicant3@example.com |

**Logging in and out.** Select **Log in** in the header, enter the email and password, and
select **Log in**. The header shows your name and role, and a navigation list for your role
appears (a side column on a laptop, tiles on a tablet, a bar at the bottom on a phone). To log
out, select your initials in the header, then **Log out**. Five wrong passwords within 15
minutes lock the account for 15 minutes.

Each role sees only its own pages. If you open another role's page, you see a notice such as
**Administrators only** instead. The job board is open to everyone. The **About CareerBridge**
link at the foot of every page lists the team and the project links.

### 12.2 Visitor

**Key features:** search the open job postings of every organization, read a posting, register
as an applicant, register as a recruiter with an organization.

**Workflow: find a job.**

1. On the front page, **Find a job and apply.**, type keywords, choose a location (**On-site**,
   **Hybrid** or **Remote**) and select **Search jobs**.
2. The page **Open job postings** lists the matching postings, newest first. Narrow the list by
   **Keywords**, **Location**, **Organization** and **Employment type**, then select **Search**.
   Every field may be left empty. "No matching postings." means nothing fits.
3. Select a posting's title to read it: organization, location, employment type, number of
   openings, **Apply by** date, description and requirements. The back link returns to the same
   list.
4. Select **Log in to apply**, or **Register as an applicant** under it. After logging in or
   registering you come back to the same posting.

**Workflow: register as an applicant.**

1. Select **Register** in the header. The page is **Create your account**.
2. Enter **Full name** (first and last name), **Email** and **Password** (at least 10
   characters, with a letter and a number), then select **Create account**.
3. The account is ready at once: you are logged in and taken to **Profile and resume**. If the
   email is already used, the form says so and offers **Log in instead**.

**Workflow: register as a recruiter and organization.**

1. On the front page, under **Hiring?**, select **Register your organization**. The page is
   **Register yourself and your organization**.
2. Fill in **1 · You** (full name, job title, work email, optional phone, password) and
   **2 · Your organization** (**Legal name** and **Website** are required; industry,
   headquarters, size and a short description are optional). Select **Send for review**.
3. The page says **Check your email**. The system sends no real email yet. When it runs on your
   own computer with the default in-memory database (§11.2), the page also shows **Open the
   verification link**: select it, and the page says **Your request is under review**. If the
   link has expired, select **Send a new link**. On the online site, or with a database set in
   `.env`, the link is not shown, so use a demo recruiter account there.
4. Wait for an administrator to approve the request (12.5). Until then, logging in shows where
   the request stands instead of opening the account.

If the organization is already registered, the form offers **Request membership** in it
instead; the administrator approves that request too.

### 12.3 Applicant

**Key features:** profile and resume, apply for a job, follow every application and its stage
history, withdraw an application, accept or decline an offer.

**Navigation:** **Home**, **Find jobs**, **Applications**, **Profile**. The home page,
**Welcome**, links to the same three tasks. Above them, two cards count your **Active applications**
(out of 5) and your **Offers to answer**; each opens **Applications**.

**Rules the screens enforce:**

- A resume is a PDF or DOCX file of 5 MB or less. A new upload replaces the one on file;
  applications already sent keep the copy they were sent with.
- At most **5 active applications** at once. An application is active in Applied, Screening,
  Interview or Offer. A slot frees up when you withdraw one or it reaches Hired, Rejected or
  Offer Declined. The pages show the count, for example "3 of 5".
- A posting can be applied to once, even after a withdrawal.
- A submitted application cannot be edited.

**Workflow: prepare the profile.**

1. Open **Profile**. The page is **Profile and resume**.
2. Under **Details**, fill in first and last name, phone, location, headline, skills, education
   and work experience. The email is your log-in and cannot be changed here. Select **Save
   details**; the page says **Profile saved.**
3. Under **Resume on file**, choose a file or drop it on the box. It uploads at once and the
   card shows its name and upload date. A refused file is named with the reason.

**Workflow: apply for a job.**

1. In **Find jobs**, open a posting and select **Apply**.
2. The application page shows the posting, **Your details**, the **Resume on file** and the
   active applications in use. If something blocks the application, a message says why and
   links to the fix: no resume yet (**Upload one in Profile & resume**, which brings you back
   here after the upload), already applied, 5 active applications, or the posting closed.
3. Tick the box "I understand that a submitted application cannot be edited…" and select
   **Submit application**. **Cancel** saves nothing.
4. The page **Application submitted** shows the new count. Select **Track application status**.

**Workflow: track, withdraw, answer an offer.**

1. Open **Applications**. Every application is listed with its organization, dates and stage.
   The filters **All**, **Active** and **Closed** narrow the list.
2. Select **View** (or **Review offer** for an offer) to open one application. It shows the
   current stage and the **Stage history** with dates and any scheduled interviews. A rejected
   application shows the date, the stage and the reason.
3. To withdraw (only in Applied, Screening or Interview), select **Withdraw application**,
   optionally choose a reason and add a comment, then select **Withdraw, final**. **Go back**
   changes nothing. The page confirms the new count of active applications.
4. At the Offer stage the page shows the offer: start date, compensation, other terms and the
   date to respond by. Select **Accept offer**, then **Accept, final**: the application moves to
   Hired. Or select **Decline**, optionally give a reason, then **Decline, final**: it moves to
   Offer Declined and frees a slot. Both answers are final. After the response deadline the
   offer can no longer be accepted.

### 12.4 Recruiter

**Key features:** create a job posting, save it as a draft, submit it for approval, revise a
returned posting, close a published posting, see the postings of the organization, join another
organization.

**Navigation:** **Postings**, **Organizations**. After logging in, a recruiter lands on
**Create job posting**.

A recruiter acts for one approved organization at a time. If you belong to several, the pages
use the one you asked to join first. A recruiter with no approved organization cannot create a posting.

**Workflow: create and submit a posting.**

1. Select **New posting** on **Postings** (or log in). The page is **Create job posting** and
   names the organization.
2. Fill in **Title**, **Location**, **Employment type**, **Salary range, optional**,
   **Application deadline** (between 1 and 90 days from today), **Openings** (1 or more),
   **Description** and **Requirements**. Select **Save draft**. A missing or wrong field is named
   with the reason.
3. The page confirms the saved draft. Select **Submit for approval**, or **Edit draft** to keep
   working on it. A submitted posting waits for the administrator and is not on the job board
   yet.

**Workflow: follow and revise postings.**

1. Open **Postings**. Every posting of the organization is listed with its status: **Draft**,
   **Pending approval**, **Returned**, **Published**, **Rejected**, **Expired** or **Closed**.
   Published and closed postings show how many applications are at each stage.
2. A returned posting shows **Revise** (a draft shows **Continue**). The edit page shows the
   administrator's comment. Change the posting and select **Submit for approval**, or **Save
   draft** to finish later. A rejected posting cannot be sent again.
3. A published posting leaves the job board by itself when its application deadline passes.

Only the recruiter who created a posting sees **Revise**, **Continue** and **Close** on it.

**Workflow: close a posting.**

1. On **Postings**, select **Close** next to a published posting.
2. The dialog explains that the posting leaves the job board and takes no new applications,
   that applications in progress continue, and that it cannot be opened again. Select **Close
   posting, final**, or **Go back**. The status becomes **Closed · by recruiter**.

**Workflow: join another organization.**

1. Open **Organizations**. **Your memberships** lists each organization with its status.
2. Under **Join another organization**, search by name or website and select an organization.
   Enter **Your role at …** and **Why you recruit for them**, then select **Send request**.
3. If the organization is not listed, select **Register a new organization**, fill in its
   details and the same two fields, and select **Send request**.
4. The request waits for the administrator. While it waits you can **Cancel request**.

After you log in, the start page shows three cards for the organization you act for, **Published**,
**Pending approval** and **Returned**, each opening **Postings**, and below them the postings open
now. Not yet available: a recruiter home page of its own, a posting detail page, reviewing applications and
moving them through the stages (UC-14), extending offers (UC-15), and switching the
organization you act for.

### 12.5 Administrator

**Key features:** approve, return or reject submitted postings; approve, question or deny
recruiter and organization requests; see all users; deactivate and reactivate recruiter accounts.

**Navigation:** **Posting approvals**, **Recruiter requests**, **Users**. After logging in, the
administrator lands on **Job posting approvals**.

**Workflow: review a posting.**

1. Open **Posting approvals**. Each submitted posting is shown in full with its organization.
   **Refresh postings** reloads the list; "All caught up!" means nothing is waiting.
2. To publish it, select **Approve & publish**. It appears on the job board at once.
3. To send it back, write the reason in **Administrator review comment** and select **Return for
   corrections**. The recruiter sees the comment and can revise it.
4. To refuse it for good, write the reason and select **Reject**, then confirm. A rejected
   posting cannot be resubmitted.

**Workflow: review a recruiter request.**

1. Open **Recruiter requests**. The requests are listed oldest first, each with the requester,
   the request type, the organization and the date. **Flagged** marks a work email that does
   not match the organization's website.
2. Select a request to see the **Requester**, the organization and, for a membership request,
   the **Justification**.
3. Under **Your decision**, select **Approve**. Or write a **Message to …** and select **Ask for
   information** (the request waits, marked "Information requested") or **Deny** (the message
   is the reason the requester receives). If the organization duplicates one already
   registered, the button approves membership in the existing one instead.

**Workflow: see the users.** Open **Users**. The page counts the users of each role and lists
everyone with name, role, email and account status: Active, Pending verification, Pending
approval (a recruiter request not yet decided), Inactive (a denied request) or Deactivated.

**Workflow: deactivate or reactivate a recruiter.**

1. Open **Users** and find the recruiter. **Deactivate** appears next to an active recruiter.
2. Select **Deactivate**. The status changes to "Deactivated". The recruiter can no longer log
   in; the log-in page tells them "This account was deactivated by the administrator", and a
   recruiter already logged in can no longer work with postings. Their postings stay as they are.
3. To undo it, select **Reactivate** next to the recruiter. They can log in again at once.

Pending and denied recruiters have no button here: they are decided under **Recruiter requests**.

After you log in, the start page shows three cards, **Postings to review**, **Recruiter requests**
and **Users**, each opening its list, and below them the postings open now. Not yet available: an
administrator home page of its own.
