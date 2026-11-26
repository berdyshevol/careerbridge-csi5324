import Link from "next/link";

// value null: the backend did not answer, so the card shows no number (ADR-0013)
export type Summary = { label: string; value: number | null; of?: number; href: string };

// A role's home: a few counts the role already sees on another screen, each a link to that screen
export default function SummaryCards({ items }: { items: Summary[] }) {
  return (
    <ul aria-label="Summary" className={`grid grid-cols-2 gap-3 ${items.length === 3 ? "md:grid-cols-3" : ""}`}>
      {items.map(({ label, value, of, href }) => (
        <li key={label}>
          <Link
            href={href}
            // The visible parts sit in separate spans; one name reads them as a sentence
            aria-label={`${label}: ${value === null ? "not available" : value}${value !== null && of !== undefined ? ` of ${of}` : ""}`}
            className="hover-raise flex h-full flex-col gap-1 rounded-xl border border-base-300 bg-base-100 px-4 py-3.5"
          >
            <span className="text-sm font-medium text-muted">{label}</span>
            {value === null ? (
              <span className="text-muted">Not available</span>
            ) : (
              <span className="font-display text-3xl font-semibold">
                {value}
                {of !== undefined && <span className="ml-1 font-sans text-sm font-medium text-muted">of {of}</span>}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
