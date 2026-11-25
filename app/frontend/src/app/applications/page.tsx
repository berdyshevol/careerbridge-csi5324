import Link from "next/link";
import AccessNotice from "@/components/AccessNotice";
import ApplicationRow from "@/components/ApplicationRow";
import BackendDown from "@/components/BackendDown";
import EmptyState from "@/components/EmptyState";
import PageTitle from "@/components/PageTitle";
import SlotMeter from "@/components/SlotMeter";
import { queryValue, SessionEnded, viewApplications, type Applications, type PageQuery } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";

type Filter = "all" | "active" | "closed";

const FILTERS: { id: Filter; label: string; href: string }[] = [
  { id: "all", label: "All", href: "/applications" },
  { id: "active", label: "Active", href: "/applications?filter=active" },
  { id: "closed", label: "Closed", href: "/applications?filter=closed" },
];

function parseFilter(value: string | undefined): Filter {
  if (value === "active" || value === "closed") {
    return value;
  }
  return "all";
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<PageQuery>;
}) {
  const filter = parseFilter(queryValue((await searchParams).filter));
  const here = FILTERS.find((item) => item.id === filter)!.href;

  const session = await serverSession();
  if (!session) {
    return (
      <AccessNotice title="Log in to see your applications" logInTo={here} register>
        Your applications belong to your applicant account.
      </AccessNotice>
    );
  }
  if (session.user.role !== "APPLICANT") {
    return (
      <AccessNotice title="Applicants only" user={session.user}>
        Only an applicant has applications.
      </AccessNotice>
    );
  }

  let applications: Applications;
  try {
    applications = await viewApplications(session.token);
  } catch (err) {
    if (err instanceof SessionEnded) {
      return (
        <AccessNotice title="Your session has ended" logInTo={here} ended>
          Log in again to see your applications.
        </AccessNotice>
      );
    }
    return <BackendDown />;
  }

  const visible =
    filter === "active"
      ? applications.active
      : filter === "closed"
        ? applications.all.filter((application) => !application.active)
        : applications.all;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle subtitle="Every application you sent, active ones first.">Applications</PageTitle>
        <SlotMeter
          used={applications.activeApplicationCount}
          total={applications.applicationLimit}
          compact
          className="sm:w-64"
        />
      </div>

      {applications.all.length === 0 ? (
        <EmptyState card action={{ href: "/jobs", label: "Find open jobs" }}>
          You have not applied to any job yet.
        </EmptyState>
      ) : (
        <>
          <nav aria-label="Filter applications" className="flex flex-wrap gap-1.5">
            {FILTERS.map((item) => {
              const selected = item.id === filter;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={selected ? "true" : undefined}
                  className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 ${
                    selected
                      ? "border-primary bg-primary text-primary-content"
                      : "border-base-300 bg-base-100 text-base-content hover:border-primary/40 hover:bg-secondary/60 active:bg-secondary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {visible.length === 0 ? (
            <EmptyState card action={{ href: "/applications", label: "Show all applications" }}>
              {filter === "active" ? "No active applications." : "No closed applications."}
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {visible.map((application) => (
                <ApplicationRow key={application.applicationId} application={application} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
