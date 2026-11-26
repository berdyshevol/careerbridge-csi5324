import Link from "next/link";
import BackendDown from "@/components/BackendDown";
import LogInForm from "@/components/LogInForm";
import PageTitle from "@/components/PageTitle";
import { queryValue, viewPosting, type PageQuery } from "@/lib/api";

// A visitor sent here by Apply comes back to that posting, and the mockup visitor-login names it
async function postingToReturnTo(next: string | undefined) {
  const id = next?.match(/^\/jobs\/(\d+)(\/apply)?$/)?.[1];
  return id ? viewPosting(id) : null;
}

export default async function LogInPage({ searchParams }: { searchParams: Promise<PageQuery> }) {
  const next = queryValue((await searchParams).next);
  let posting;
  try {
    posting = await postingToReturnTo(next);
  } catch {
    // Logging in needs the same backend, so the page says it is waking instead of offering a form that would fail
    return <BackendDown />;
  }
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <PageTitle
        subtitle={
          posting &&
          `Log in to apply for ${posting.title} at ${posting.organization.name}. You come back to it afterwards.`
        }
      >
        Log in
      </PageTitle>
      <LogInForm next={next} />
      <div className="flex flex-col gap-2 text-sm">
        <Link href="/forgot-password" className="link link-primary self-start">
          Forgot password?
        </Link>
        <p>
          New here?{" "}
          <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="link link-primary">
            Register as an applicant
          </Link>
        </p>
      </div>
    </div>
  );
}
