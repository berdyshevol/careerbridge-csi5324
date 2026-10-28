import Link from "next/link";
import { formatUtcDay, type Resume } from "@/lib/api";

// The side-column card of the resume on file (CO-03.1); children add what the screen says about it
export default function ResumeOnFile({ resume, children }: { resume: Resume | null; children?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1 rounded-2xl border border-base-300 bg-base-100 p-5">
      <h2 className="font-semibold">Resume on file</h2>
      {resume ? (
        <>
          <p>{resume.fileName}</p>
          <p className="text-sm text-muted">Uploaded {formatUtcDay(resume.uploadDate)}</p>
          {children}
        </>
      ) : (
        <p className="text-muted">No resume yet.</p>
      )}
      <div className="grow" />
      <Link href="/profile" className="link link-primary pt-2 font-semibold no-underline hover:underline">
        {resume ? "Replace resume" : "Upload a resume"}
      </Link>
    </section>
  );
}
