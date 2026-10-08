import Link from "next/link";

// Nothing to show yet: one sentence, and optionally where to go.
export default function EmptyState({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <p className="text-muted">
      {children}
      {action && (
        <>
          {" "}
          <Link href={action.href} className="link link-primary">
            {action.label}
          </Link>
        </>
      )}
    </p>
  );
}
