import { formatDate, type JobPosting } from "@/lib/api";
import PageTitle from "./PageTitle";

// The free-text fields keep the recruiter's line breaks: each line of the description is a
// paragraph, each line of the requirements an item
function lines(text: string): string[] {
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

const chip = "rounded-lg px-2.5 py-1 text-sm font-semibold";

// Every detail of one posting (FR-UC04.9). action: what the reader can do about it, under the chips
export default function PostingDetails({ posting, action }: { posting: JobPosting; action?: React.ReactNode }) {
  const openings = `${posting.numberOfOpenings} ${posting.numberOfOpenings === 1 ? "opening" : "openings"}`;
  return (
    <article className="flex min-w-0 flex-col gap-5 lg:rounded-2xl lg:border lg:border-base-300 lg:bg-base-100 lg:p-8">
      <PageTitle context={posting.organization.name}>{posting.title}</PageTitle>

      <ul aria-label="Posting facts" className="flex flex-wrap gap-2">
        {[posting.location, posting.employmentType, openings].map((fact) => (
          <li key={fact} className={`${chip} bg-base-200`}>
            {fact}
          </li>
        ))}
        <li className={`${chip} border border-base-300 text-muted`}>
          Apply by {formatDate(posting.applicationDeadline)}
        </li>
      </ul>

      {action}

      <section className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">About the role</h2>
        {lines(posting.description).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </section>

      <section className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">Requirements</h2>
        <ul className="list-disc pl-5">
          {lines(posting.jobRequirements).map((requirement, index) => (
            <li key={index}>{requirement}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}
