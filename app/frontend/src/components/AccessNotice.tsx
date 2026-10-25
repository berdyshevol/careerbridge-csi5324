import Link from "next/link";
import { ROLE_LABELS, type SessionUser } from "@/lib/session";
import EndSession from "./EndSession";

// A page that needs a log-in, or another role, says so and offers the way in (UC-01 extensions 6a, 6c)
export default function AccessNotice({
  title,
  children,
  logInTo,
  register = false,
  user,
  ended = false,
}: {
  title: string;
  children: React.ReactNode;
  logInTo?: string;
  register?: boolean;
  // Logged in, but in another role: the notice says who they are
  user?: SessionUser;
  // The backend refused the token: the cookie goes, so the header stops showing the user
  ended?: boolean;
}) {
  const next = logInTo ? `?next=${encodeURIComponent(logInTo)}` : "";
  return (
    <section className="card max-w-xl border border-base-300 bg-base-100">
      {ended && <EndSession />}
      <div className="card-body gap-4">
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="text-muted">
          {user && (
            <>
              You are logged in as {user.firstName} {user.lastName}, {ROLE_LABELS[user.role].toLowerCase()}.{" "}
            </>
          )}
          {children}
        </p>
        {logInTo && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={`/login${next}`} className="btn btn-primary">
              Log in
            </Link>
            {register && (
              <Link href={`/register${next}`} className="link link-primary">
                New here? Register as an applicant
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
