import Link from "next/link";
import { redirect } from "next/navigation";
import PageTitle from "@/components/PageTitle";
import RegisterForm from "@/components/RegisterForm";
import { queryValue, type PageQuery } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<PageQuery> }) {
  // UC-02 precondition: the visitor is not logged in
  if (await serverSession()) {
    redirect("/profile");
  }
  const { next } = await searchParams;
  return (
    // The mockup keeps the form to the left half of the laptop column
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-5 lg:w-1/2">
        <PageTitle eyebrow="Applicant account" subtitle="It is ready at once. Next you add a resume, then you can apply.">
          Create your account
        </PageTitle>
        <RegisterForm next={queryValue(next)} />
        {/* UC-02 extension 1a */}
        <p className="text-sm text-muted">
          Hiring?{" "}
          <Link href="/recruiter/register" className="link link-primary font-semibold no-underline hover:underline">
            Register your organization
          </Link>{" "}
          instead.
        </p>
      </div>
    </div>
  );
}
