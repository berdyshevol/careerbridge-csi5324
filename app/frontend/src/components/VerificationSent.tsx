import Link from "next/link";

// UC-08 step 5: what the visitor does next. The link itself only shows where there is no mail service.
export default function VerificationSent({ email, verificationLink }: { email?: string; verificationLink?: string | null }) {
  return (
    <section role="status" className="card border border-primary bg-base-100">
      <div className="card-body gap-2">
        <h2 className="font-display text-xl font-semibold">Check your email</h2>
        <p>
          We sent a link{email ? ` to ${email}` : ""}. Open it to send the request to the administrator.
        </p>
        <p className="text-sm text-muted">If the link expires, you can ask for a new one.</p>
        {verificationLink && (
          <p className="text-sm">
            This demonstration sends no email.{" "}
            <Link href={verificationLink} className="link link-primary font-semibold">
              Open the verification link
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
