import Link from "next/link";

// One of a role's actions on its home: what it is for, and the way there
export default function ActionRow({
  title,
  description,
  href,
  action,
  primary = false,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
  primary?: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3.5 md:flex-row md:items-center md:gap-5">
      <div className="min-w-0 grow">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <Link
        href={href}
        className={primary ? "btn btn-primary" : "link link-primary font-semibold no-underline hover:underline"}
      >
        {action}
      </Link>
    </li>
  );
}
