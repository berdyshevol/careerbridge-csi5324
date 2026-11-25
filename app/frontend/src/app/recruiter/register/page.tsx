import { redirect } from "next/navigation";
import PageTitle from "@/components/PageTitle";
import RecruiterRegisterForm from "@/components/RecruiterRegisterForm";
import { serverSession } from "@/lib/serverSession";

// UC-08. Precondition: the visitor is not logged in.
export default async function RecruiterRegisterPage() {
  if (await serverSession()) {
    redirect("/");
  }
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageTitle eyebrow="For employers" subtitle="An administrator checks every new employer. Until then you cannot post jobs.">
        Register yourself and your organization
      </PageTitle>
      <div className="lg:w-2/3">
        <RecruiterRegisterForm />
      </div>
    </div>
  );
}
