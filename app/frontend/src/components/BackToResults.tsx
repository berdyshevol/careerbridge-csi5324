import Link from "next/link";

export default function BackToResults({ href }: { href: string }) {
  return (
    <Link href={href} className="link link-primary self-start text-sm font-semibold no-underline hover:underline">
      <span aria-hidden="true">← </span>Back to results
    </Link>
  );
}
