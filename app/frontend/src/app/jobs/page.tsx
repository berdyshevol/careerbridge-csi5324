import BackendDown from "@/components/BackendDown";
import PostingCard from "@/components/PostingCard";
import { searchPostings, type JobPosting } from "@/lib/api";

// UC-01 Browse Job Postings: the list of open postings, with a keyword search.
export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string }>;
}) {
  const { keyword } = await searchParams;

  let postings: JobPosting[] | null = null;
  try {
    postings = await searchPostings(keyword);
  } catch {
    postings = null;
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-3xl font-semibold">Open job postings</h1>

      <form action="/jobs" className="flex gap-2">
        <label htmlFor="keyword" className="sr-only">
          Search job postings
        </label>
        <input
          id="keyword"
          name="keyword"
          type="search"
          defaultValue={keyword ?? ""}
          placeholder="Title, organization or location"
          className="input w-full"
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {postings === null ? (
        <BackendDown />
      ) : postings.length === 0 ? (
        <p className="text-muted">No open postings match your search.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {postings.map((posting) => (
            <PostingCard key={posting.jobPostId} posting={posting} />
          ))}
        </ul>
      )}
    </div>
  );
}
