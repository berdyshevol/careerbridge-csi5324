import Link from "next/link";

export default function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="link link-primary self-start text-sm font-semibold no-underline hover:underline">
      <span aria-hidden="true">← </span>
      {children}
    </Link>
  );
}
