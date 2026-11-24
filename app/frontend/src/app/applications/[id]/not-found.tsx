import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export default function ApplicationNotFound() {
  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/applications"
        className="link link-primary self-start text-sm font-semibold no-underline hover:underline"
      >
        ← All applications
      </Link>
      <EmptyState card>This application could not be found.</EmptyState>
    </div>
  );
}

