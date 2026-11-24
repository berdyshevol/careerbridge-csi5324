import Link from "next/link";
import { formatDate, type ApplicationSummary } from "@/lib/api";
import { StageBadge } from "./StageBadge";

export type ApplicationRowItem = Pick<
  ApplicationSummary,
  "applicationId" | "title" | "organizationName" | "applicationStatus"
> & {
  dateApplied?: string;
  lastStageChangeDate?: string;
};

export default function ApplicationRow({ application }: { application: ApplicationRowItem }) {
  const isOffer = application.applicationStatus === "Offer";
  const metaParts = [application.organizationName];
  if (application.dateApplied) {
    metaParts.push(`Applied ${formatDate(application.dateApplied)}`);
  }
  if (application.lastStageChangeDate) {
    metaParts.push(`last change ${formatDate(application.lastStageChangeDate)}`);
  }

  return (
    <li
      className={`flex flex-col gap-2.5 rounded-xl border px-4 py-3.5 md:flex-row md:items-center md:gap-4 ${
        isOffer ? "border-transparent bg-warning" : "border-base-300 bg-base-100"
      }`}
    >
      <div className="min-w-0 grow">
        <p className="font-semibold">{application.title}</p>
        <p className={`text-sm ${isOffer ? "text-warning-content" : "text-muted"}`}>
          {metaParts.join(" · ")}
        </p>
      </div>

      <StageBadge
        stage={application.applicationStatus}
        onWarning={isOffer}
        className="min-w-28 shrink-0 self-start md:self-center"
      />

      <Link
        href={`/applications/${application.applicationId}`}
        className={`btn btn-sm w-full shrink-0 md:w-auto ${isOffer ? "btn-neutral" : ""}`}
      >
        {isOffer ? "Review offer" : "View"}
      </Link>
    </li>
  );
}
