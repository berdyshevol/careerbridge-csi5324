import Link from "next/link";

// The only warning-colored panel on a screen.
export default function OfferPanel({
  title,
  organizationName,
  respondBy,
}: {
  title: string;
  organizationName: string;
  respondBy: string; // already formatted for reading
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-warning p-5 text-warning-content md:flex-row md:items-center md:gap-5 lg:flex-col lg:items-stretch lg:gap-3">
      <div className="min-w-0 grow">
        <p className="text-sm font-semibold uppercase tracking-wider">Offer waiting</p>
        <p className="mt-1 font-display text-xl font-semibold text-base-content">{title}</p>
        <p>
          {organizationName} · Respond by {respondBy}
        </p>
      </div>
      <Link href="/offers" className="btn btn-neutral h-12">
        Review offer
      </Link>
    </section>
  );
}
