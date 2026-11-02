import Link from "next/link";
import { formatUtcDay, type Resume } from "@/lib/api";

// The side-column card of the resume on file (CO-03.1); children add what the screen says about it.
// profileHref lets a screen ask the profile to send the applicant back after the upload.
export default function ResumeOnFile({
  resume,
  profileHref = "/profile",
  children,
}: {
  resume: Resume | null;
  profileHref?: string;
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
      <Link href={profileHref} className="link link-primary pt-2 font-semibold no-underline hover:underline">
        {resume ? "Replace resume" : "Upload a resume"}
      </Link>
    </section>
  );
}
