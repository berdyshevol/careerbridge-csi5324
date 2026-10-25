import { notFound } from "next/navigation";
import ApplyForm from "@/components/ApplyForm";
import BackendDown from "@/components/BackendDown";
import { startApplication, viewApplications, viewPosting, type ApplicationStart, type Applications, type JobPosting } from "@/lib/api";
import { resume } from "@/lib/sampleDesk";

// The applications come from the backend; the resume stays sample data
// until UC-03 keeps it there (see src/lib/sampleDesk.ts and src/lib/apply.ts).
export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let posting: JobPosting | null;
  let applications: Applications;
  let start: ApplicationStart;
  try {
    [posting, applications] = await Promise.all([viewPosting(id), viewApplications()]);
    if (posting) {
      start = await startApplication(posting.jobPostId, resume);
    }
  } catch {
    return <BackendDown />;
  }
  if (!posting) {
    notFound();
  }

  return <ApplyForm posting={posting} desk={{ applications: applications.active, appliedPostingIds: applications.appliedPostingIds, resume, refusal: start!.refusal?.reason ?? null }} />;
}
