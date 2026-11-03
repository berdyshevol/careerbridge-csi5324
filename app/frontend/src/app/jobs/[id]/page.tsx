import { notFound } from "next/navigation";
import ApplyPanel, { ApplyAction, type Reader } from "@/components/ApplyPanel";
import BackToResults from "@/components/BackToResults";
import BackendDown from "@/components/BackendDown";
import PostingDetails from "@/components/PostingDetails";
import {
  isOpen,
  searchCriteria,
  searchQuery,
  viewPosting,
  type JobPosting,
  type PageQuery,
} from "@/lib/api";
import { serverSession } from "@/lib/serverSession";

export default async function PostingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<PageQuery>;
}) {
  const { id } = await params;

  let posting: JobPosting | null;
  try {
    posting = await viewPosting(id);
  } catch {
    return <BackendDown />;
  }
  if (!posting) {
    notFound();
  }

  const session = await serverSession();
  const reader: Reader = !session ? "visitor" : session.user.role === "APPLICANT" ? "applicant" : "staff";
  const apply = { jobPostId: posting.jobPostId, reader, open: isOpen(posting) };

  return (
    <div className="flex flex-col gap-5">
      <BackToResults href={`/jobs${searchQuery(searchCriteria(await searchParams))}`} />

      {reader === "applicant" ? (
        <PostingDetails posting={posting} action={<ApplyAction {...apply} />} />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <PostingDetails
              posting={posting}
              action={
                <div className="lg:hidden">
                  <ApplyPanel {...apply} />
                </div>
              }
            />
          </div>
          <aside className="hidden lg:flex lg:w-80 lg:shrink-0 lg:flex-col">
            <ApplyPanel {...apply} side />
          </aside>
        </div>
      )}
    </div>
  );
}
