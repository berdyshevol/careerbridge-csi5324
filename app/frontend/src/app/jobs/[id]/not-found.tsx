"use client";

import { useSearchParams } from "next/navigation";
import BackToResults from "@/components/BackToResults";
import EmptyState from "@/components/EmptyState";
import { searchCriteria, searchQuery } from "@/lib/api";

// A not-found page gets no searchParams, so it reads the address to lead back to the same search.
// Without this file Next.js draws its own 404, whose inline style paints the body white.
export default function PostingNotFound() {
  const query = Object.fromEntries(useSearchParams());

  return (
    <div className="flex flex-col gap-5">
      <BackToResults href={`/jobs${searchQuery(searchCriteria(query))}`} />
      <EmptyState card>This posting could not be found.</EmptyState>
    </div>
  );
}
