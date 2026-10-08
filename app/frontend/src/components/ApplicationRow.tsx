import Link from "next/link";
import type { DeskApplication } from "@/lib/sampleDesk";
import { StageBadge, StageProgress } from "./StageBadge";

// One application on the desk: a row on tablets and laptops, a stacked card on phones.
export default function ApplicationRow({ application }: { application: DeskApplication }) {
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
        <StageBadge stage={application.applicationStatus} className="md:order-3 md:w-28" />
      </div>

      <StageProgress stage={application.applicationStatus} className="md:order-2 md:w-40" />

      <Link
        href={isOffer ? "/offers" : "/applications"}
        className="link link-primary py-1 font-semibold no-underline hover:underline md:order-4 md:py-3"
      >
        {isOffer ? "Review" : "View"}
      </Link>
    </li>
  );
}
