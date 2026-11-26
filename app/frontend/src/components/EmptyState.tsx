import Link from "next/link";
import { InboxIcon } from "./Icons";

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
      <div className="card-body flex-row items-center gap-4 p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-base-200 text-muted">
          <InboxIcon />
        </span>
        {text}
      </div>
    </div>
  ) : (
    text
  );
}
