import { notFound } from "next/navigation";
import ApplyForm from "@/components/ApplyForm";
import BackendDown from "@/components/BackendDown";
import { viewPosting, type JobPosting } from "@/lib/api";
import { applications, resume } from "@/lib/sampleDesk";

// The applicant's resume and active applications are sample data until UC-03
// and UC-05 exist (see src/lib/sampleDesk.ts and src/lib/apply.ts).
export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
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

  return <ApplyForm posting={posting} initialDesk={{ applications, resume }} />;
}
