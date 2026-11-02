import Link from "next/link";

// card: when the empty state stands in place of a list of cards, as on the job board
export default function EmptyState({
  children,
  action,
  card = false,
}: {
  children: React.ReactNode;
  action?: { href: string; label: string };
  card?: boolean;
}) {
  const text = (
    <p className={card ? "font-semibold" : "text-muted"}>
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
  return card ? (
    <div className="card border border-base-300 bg-base-100">
      <div className="card-body p-5">{text}</div>
    </div>
  ) : (
    text
  );
}
