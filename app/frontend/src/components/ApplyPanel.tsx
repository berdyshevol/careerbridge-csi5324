import Link from "next/link";

// Who is reading a posting decides what its Apply offers (UC-04 step 1, extensions 1a, 1b)
export type Reader = "visitor" | "applicant" | "staff";

type Props = { jobPostId: number; reader: Reader; open: boolean };

// The Apply button, or what replaces it
export function ApplyAction({ jobPostId, reader, open, side = false }: Props & { side?: boolean }) {
  if (!open) {
    return (
      <p role="status" className="alert alert-warning">
        This posting is no longer accepting applications.
      </p>
    );
  }
  if (reader === "staff") {
    return (
      <p role="status" className="alert alert-info">
        Only applicant accounts can apply.
      </p>
    );
  }
  if (reader === "applicant") {
    return (
      <div>
        <Link href={`/jobs/${jobPostId}/apply`} className="btn btn-primary">
          Apply
        </Link>
      </div>
    );
  }
  // After logging in or registering the visitor comes back to this posting (1a step 2)
  const next = `?next=${encodeURIComponent(`/jobs/${jobPostId}`)}`;
  return (
    <>
      <Link href={`/login${next}`} className="btn btn-primary btn-block">
        Log in to apply
      </Link>
      <p className={side ? "text-sm" : "text-center text-sm text-muted"}>
        New here?{" "}
        <Link href={`/register${next}`} className="link link-primary font-semibold no-underline hover:underline">
          Register as an applicant
        </Link>
      </p>
    </>
  );
}

// Apply for a reader who is not an applicant: a card under the facts on phones and tablets,
// a side panel (side) beside the posting on laptops
export default function ApplyPanel({ side = false, ...props }: Props & { side?: boolean }) {
  if (!side) {
    return (
      <section aria-label="Apply" className="card border border-base-300 bg-base-100">
        <div className="card-body gap-3 p-5">
          <ApplyAction {...props} />
        </div>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5">
      <h2 className="font-semibold">Apply for this job</h2>
      {props.open && props.reader === "visitor" && (
        <p className="text-sm text-muted">
          Log in with an applicant account. You come back to this posting after you log in.
        </p>
      )}
      <ApplyAction {...props} side />
    </section>
  );
}
