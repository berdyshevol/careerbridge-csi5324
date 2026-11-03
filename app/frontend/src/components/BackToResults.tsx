import Link from "next/link";
import { searchCriteria, searchQuery, type PageQuery } from "@/lib/api";

// query: the posting's own address query, which carries the search it was opened from
export default function BackToResults({ query }: { query: PageQuery }) {
  return (
    <Link
      href={`/jobs${searchQuery(searchCriteria(query))}`}
      className="link link-primary self-start text-sm font-semibold no-underline hover:underline"
    >
      <span aria-hidden="true">← </span>Back to results
    </Link>
  );
}
