import EmptyState from "@/components/EmptyState";
import FormField, { SelectField } from "@/components/FormField";
import PageTitle from "@/components/PageTitle";
import PostingCard from "@/components/PostingCard";
import { searchCriteria, searchPostings, searchQuery, type JobPosting, type PageQuery } from "@/lib/api";
import { EMPLOYMENT_TYPES, LOCATIONS } from "@/lib/postingOptions";
import { serverSession } from "@/lib/serverSession";
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

  const session = serverSession();
  let postings: JobPosting[] | null = null;
  let open: JobPosting[] = [];
  try {
    // The organization list offers every organization with an open posting, not only those the criteria left
    const [found, all] = await Promise.all([searchPostings(criteria), search ? searchPostings() : null]);
    postings = found;
    open = all ?? found;
  } catch {
    postings = null;
  }

  const organizations = [...new Set(open.map((posting) => posting.organization.name))].sort();
  // A shared link or a failed search keeps an organization the list does not hold
  if (criteria.organization && !organizations.includes(criteria.organization)) {
    organizations.push(criteria.organization);
  }

  const loggedIn = Boolean(await session);

  return (
    <div className="flex flex-col gap-5">
      <PageTitle subtitle={`Every organization's open postings, newest first.${loggedIn ? "" : " No account needed."}`}>
        Open job postings
      </PageTitle>

      <form action="/jobs" aria-label="Search criteria" className="card border border-base-300 bg-base-100">
        <div className="card-body gap-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <FormField id="keyword" name="keyword" type="search" label="Keywords" defaultValue={criteria.keyword ?? ""} />
            <SelectField id="location" name="location" label="Location" defaultValue={criteria.location ?? ""}>
              <option value="">Any location</option>
              {LOCATIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="organization"
              name="organization"
              label="Organization"
              defaultValue={criteria.organization ?? ""}
            >
              <option value="">All organizations</option>
              {organizations.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="employmentType"
              name="employmentType"
              label="Employment type"
              defaultValue={criteria.employmentType ?? ""}
            >
              <option value="">Any type</option>
              {EMPLOYMENT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
        </div>
      </form>

      {postings === null ? (
        <div role="alert" className="alert alert-error">
          <span>The search failed. Your criteria are kept; select Search to try again.</span>
        </div>
      ) : postings.length === 0 ? (
        <EmptyState card>{search ? "No matching postings." : "No open positions right now."}</EmptyState>
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
