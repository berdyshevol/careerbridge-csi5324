import Link from "next/link";
import { formatDate, type ApplicationSummary } from "@/lib/api";
import type { ApplicationStage } from "@/lib/stages";
import { StageBadge } from "./StageBadge";

export type ApplicationRowItem = Pick<
  ApplicationSummary,
  "applicationId" | "title" | "organizationName" | "applicationStatus"
> & {
  dateApplied?: string;
  lastStageChangeDate?: string;
};

// Stage-matched office surface tints on hover, focus, and click (theme tokens only, ADR-0004)
function rowSurface(stage: ApplicationStage): string {
  switch (stage) {
    case "Offer":
      return "border-accent/25 border-l-accent bg-warning hover:bg-warning/85 focus-within:border-accent active:bg-warning/75";
    case "Interview":
      return "border-base-300 border-l-info/50 bg-base-100 hover:border-info/40 hover:border-l-info hover:bg-info/5 focus-within:border-info/50 focus-within:border-l-info focus-within:bg-info/10 active:bg-info/15";
    case "Applied":
    case "Screening":
    case "Hired":
      return "border-base-300 border-l-primary/40 bg-base-100 hover:border-primary/40 hover:border-l-primary hover:bg-secondary/40 focus-within:border-primary/60 focus-within:border-l-primary focus-within:bg-secondary/60 active:bg-secondary";
    case "Rejected":
      return "border-base-300 border-l-error/40 bg-base-100 hover:border-error/40 hover:border-l-error hover:bg-error/5 focus-within:border-error/50 focus-within:border-l-error focus-within:bg-error/10 active:bg-error/15";
    case "Withdrawn":
    case "Offer Declined":
      return "border-base-300 border-l-base-300 bg-base-100 hover:border-neutral/30 hover:border-l-neutral/50 hover:bg-base-200/70 focus-within:border-neutral/40 focus-within:border-l-neutral/60 focus-within:bg-base-200 active:bg-base-200";
  }
}

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
      className={`flex flex-col gap-2.5 rounded-xl border border-l-4 px-4 py-3.5 shadow-lift transition-colors duration-200 md:flex-row md:items-center md:gap-4 ${rowSurface(application.applicationStatus)}`}
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
