import Link from "next/link";
import { STAGES, type DeskApplication, type Stage } from "@/lib/sampleDesk";

const chipStyle: Record<Stage, string> = {
  Applied: "bg-base-200 text-base-content",
  Screening: "bg-secondary text-secondary-content",
  Interview: "bg-secondary text-secondary-content",
  Offer: "bg-warning text-warning-content",
};

// One application on the desk: a row on tablets and laptops, a stacked card on phones.
export default function ApplicationRow({ application }: { application: DeskApplication }) {
  const stageNumber = STAGES.indexOf(application.applicationStatus) + 1;
  const isOffer = application.applicationStatus === "Offer";

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3 md:flex-row md:items-center md:gap-5 md:py-4">
      <div className="flex items-start gap-3 md:contents">
        <div className="min-w-0 grow">
          <p className="font-semibold">{application.title}</p>
          <p className="text-muted">
            {application.organizationName}
            <span className="hidden md:inline"> · {application.location}</span>
          </p>
        </div>
        <span
          className={`rounded-lg px-2.5 py-1 text-center text-sm font-semibold md:order-3 md:w-28 ${chipStyle[application.applicationStatus]}`}
        >
          {application.applicationStatus}
        </span>
      </div>

      <div
        role="img"
        aria-label={`Stage ${stageNumber} of ${STAGES.length}`}
        className="flex gap-1 md:order-2 md:w-40"
      >
        {STAGES.map((stage, index) => (
          <span
            key={stage}
            className={`h-1.5 grow rounded-full ${index < stageNumber ? "bg-primary" : "bg-base-300"}`}
          />
        ))}
      </div>

      <Link
        href={isOffer ? "/offers" : "/applications"}
        className="link link-primary py-1 font-semibold no-underline hover:underline md:order-4 md:py-3"
      >
        {isOffer ? "Review" : "View"}
      </Link>
    </li>
  );
}
