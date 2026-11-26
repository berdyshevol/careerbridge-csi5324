import ResetPasswordForm from "@/components/ResetPasswordForm";
import PageTitle from "@/components/PageTitle";
import { queryValue, type PageQuery } from "@/lib/api";

// The page the reset email links to. Opening it changes nothing; saving the new password uses the link
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<PageQuery> }) {
  const token = queryValue((await searchParams).token) ?? "";
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <PageTitle subtitle="Choose a new password for your account.">Choose a new password</PageTitle>
      <ResetPasswordForm token={token} />
    </div>
  );
}
