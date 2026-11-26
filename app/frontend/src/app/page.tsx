import Link from "next/link";
import ActionRow from "@/components/ActionRow";
import BackendDown from "@/components/BackendDown";
import FormField, { SelectField } from "@/components/FormField";
import PageTitle from "@/components/PageTitle";
import PostingCard from "@/components/PostingCard";
import SummaryCards, { type Summary } from "@/components/SummaryCards";
import {
  openPostingApprovalQueue,
  openRecruiterRequestQueue,
  searchPostings,
  viewApplications,
  viewRecruiterPostings,
  viewUsers,
  type JobPosting,
} from "@/lib/api";
import { LOCATIONS } from "@/lib/postingOptions";
import { serverSession } from "@/lib/serverSession";

// `/` is one address with a page per role: visitor-home and applicant-home in spec/screens/README.md
export default async function HomePage() {
  const session = await serverSession();
  if (!session) {
    return <VisitorHome />;
  }
  if (session.user.role === "APPLICANT") {
    return <ApplicantHome summary={await applicantSummary(session.token)} />;
  }
  const summary =
    session.user.role === "RECRUITER" ? await recruiterSummary(session.token) : await administratorSummary(session.token);
  return <StaffHome firstName={session.user.firstName} summary={summary} postings={await openPostings()} />;
}

// null: the backend did not answer, or the session ended; the card then shows no number (ADR-0013)
async function orNull<T>(call: Promise<T>): Promise<T | null> {
  try {
    return await call;
  } catch {
    return null;
  }
}

async function applicantSummary(token: string): Promise<Summary[]> {
  const applications = await orNull(viewApplications(token));
  return [
    {
      label: "Active applications",
      value: applications?.activeApplicationCount ?? null,
      of: applications?.applicationLimit,
      href: "/applications",
    },
    {
      label: "Offers to answer",
      value: applications ? applications.all.filter((application) => application.applicationStatus === "Offer").length : null,
      href: "/applications",
    },
  ];
}

async function recruiterSummary(token: string): Promise<Summary[]> {
  const postings = (await orNull(viewRecruiterPostings(token)))?.postings;
  const count = (status: string) => postings?.filter((row) => row.postStatus === status).length ?? null;
  return [
    { label: "Published", value: count("PUBLISHED"), href: "/recruiter/postings" },
    { label: "Pending approval", value: count("PENDING_APPROVAL"), href: "/recruiter/postings" },
    { label: "Returned", value: count("RETURNED"), href: "/recruiter/postings" },
  ];
}

async function administratorSummary(token: string): Promise<Summary[]> {
  const [postings, requests, users] = await Promise.all([
    orNull(openPostingApprovalQueue(token)),
    orNull(openRecruiterRequestQueue(token)),
    orNull(viewUsers(token)),
  ]);
  return [
    { label: "Postings to review", value: postings?.length ?? null, href: "/admin/postings" },
    { label: "Recruiter requests", value: requests?.length ?? null, href: "/admin/requests" },
    { label: "Users", value: users?.users.length ?? null, href: "/admin/users" },
  ];
}

// null: the backend is down, and the section says so
async function openPostings() {
  try {
    return await searchPostings();
  } catch {
    return null;
  }
}

function VisitorHome() {
  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        hero
        eyebrow="Open jobs from every organization"
        subtitle="Search without an account. Register when you are ready to apply."
      >
        Find a job and apply.
      </PageTitle>

      {/* The job board takes the same criteria and drops the ones left empty from the address */}
      <form action="/jobs" aria-label="Search job postings" className="card border border-base-300 bg-base-100">
        <div className="card-body gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField id="keyword" name="keyword" type="search" label="Keywords" />
            <SelectField id="location" name="location" label="Location" defaultValue="">
              <option value="">Any location</option>
              {LOCATIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </SelectField>
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Search jobs
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        <WayIn
          title="Looking for a job?"
          href="/register"
          action="Register as an applicant"
        >
          Create an account, add your resume and keep up to 5 applications going at once.
        </WayIn>
        <WayIn title="Hiring?" href="/recruiter/register" action="Register your organization">
          Register yourself and your organization. An administrator approves new employers.
        </WayIn>
      </div>
    </div>
  );
}

function WayIn({
  title,
  href,
  action,
  children,
}: {
  title: string;
  href: string;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted">{children}</p>
        <Link href={href} className="link link-primary font-semibold no-underline hover:underline">
          {action}
        </Link>
      </div>
    </section>
  );
}

function ApplicantHome({ summary }: { summary: Summary[] }) {
  return (
    <div className="flex flex-col gap-5 lg:rounded-2xl lg:border lg:border-base-300 lg:bg-base-100 lg:p-8">
      <PageTitle>Welcome</PageTitle>
      <SummaryCards items={summary} />
      <ul className="flex flex-col gap-3">
        <ActionRow
          title="Find jobs"
          description="Search the open job postings and apply."
          href="/jobs"
          action="Find jobs"
          primary
        />
        <ActionRow
          title="My applications"
          description="Follow your applications, withdraw one or answer an offer."
          href="/applications"
          action="Open applications"
        />
        <ActionRow
          title="Profile and resume"
          description="Keep your details and resume up to date."
          href="/profile"
          action="Open profile"
        />
      </ul>
    </div>
  );
}

// Recruiters and administrators keep this until their own homes (recruiter-home, admin-home) are built
function StaffHome({
  firstName,
  summary,
  postings,
}: {
  firstName: string;
  summary: Summary[];
  postings: JobPosting[] | null;
}) {
  return (
    <div className="flex flex-col gap-5 lg:rounded-2xl lg:border lg:border-base-300 lg:bg-base-100 lg:p-8">
      <PageTitle subtitle="Here are the job postings open now.">Welcome back, {firstName}</PageTitle>
      <SummaryCards items={summary} />
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Recently published</h2>
          <Link href="/jobs" className="link link-primary font-semibold no-underline hover:underline">
            See all open jobs
          </Link>
        </div>
        {postings === null ? (
          <BackendDown />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {postings.slice(0, 2).map((posting) => (
              <PostingCard key={posting.jobPostId} posting={posting} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
