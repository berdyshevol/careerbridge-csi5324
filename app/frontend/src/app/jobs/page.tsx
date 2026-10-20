import BackendDown from "@/components/BackendDown";
import EmptyState from "@/components/EmptyState";
import PageTitle from "@/components/PageTitle";
import PostingCard from "@/components/PostingCard";
import { searchCriteria, searchPostings, searchQuery, type JobPosting, type PageQuery } from "@/lib/api";
import { EMPLOYMENT_TYPES, LOCATIONS } from "@/lib/postingOptions";
import { redirect } from "next/navigation";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<PageQuery>;
}) {
  const query = await searchParams;
  const criteria = searchCriteria(query);
  const search = searchQuery(criteria);

  // The form also sends the fields left empty; the address a visitor shares should hold only the search
  const asked = new URLSearchParams();
  for (const [name, values] of Object.entries(query)) {
    for (const value of [values ?? []].flat()) {
      asked.append(name, value);
    }
  }
  if ((asked.size ? `?${asked}` : "") !== search) {
    redirect(`/jobs${search}`);
  }

  let postings: JobPosting[] | null = null;
  try {
    postings = await searchPostings(criteria);
  } catch {
    postings = null;
  }

  return (
    <div className="flex flex-col gap-5">
      <PageTitle>Open job postings</PageTitle>

      <form action="/jobs" className="flex flex-col gap-2 md:flex-row">
        <label htmlFor="keyword" className="sr-only">
          Search job postings
        </label>
        <input
          id="keyword"
          name="keyword"
          type="search"
          defaultValue={criteria.keyword ?? ""}
          placeholder="Title, description or requirements"
          className="input w-full md:flex-1"
        />
        <label htmlFor="location" className="sr-only">
          Location
        </label>
        <select id="location" name="location" defaultValue={criteria.location ?? ""} className="select w-full md:w-44">
          <option value="">Any location</option>
          {LOCATIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <label htmlFor="employmentType" className="sr-only">
          Employment type
        </label>
        <select
          id="employmentType"
          name="employmentType"
          defaultValue={criteria.employmentType ?? ""}
          className="select w-full md:w-44"
        >
          <option value="">Any type</option>
          {EMPLOYMENT_TYPES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {postings === null ? (
        <BackendDown />
      ) : postings.length === 0 ? (
        <EmptyState action={{ href: "/jobs", label: "Clear the search" }}>
          No open postings match your search.
        </EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {postings.map((posting) => (
            <PostingCard key={posting.jobPostId} posting={posting} search={search} />
          ))}
        </ul>
      )}
    </div>
  );
}
