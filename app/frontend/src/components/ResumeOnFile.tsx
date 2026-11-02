import Link from "next/link";
import { formatUtcDay, type Resume } from "@/lib/api";
import { withNext } from "@/lib/session";

// The side-column card of the resume on file (CO-03.1); children add what the screen says about it.
// returnTo is the page the profile sends the applicant back to after the upload.
export default function ResumeOnFile({
  resume,
  returnTo,
  children,
}: {
  resume: Resume | null;
  returnTo?: string;
  children?: React.ReactNode;
}) {
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
      <Link href={withNext("/profile", returnTo)} className="link link-primary pt-2 font-semibold no-underline hover:underline">
        {resume ? "Replace resume" : "Upload a resume"}
      </Link>
    </section>
  );
}
