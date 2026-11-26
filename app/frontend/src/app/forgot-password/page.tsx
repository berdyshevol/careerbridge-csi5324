import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import PageTitle from "@/components/PageTitle";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <PageTitle subtitle="Enter the email you log in with. We send a link to choose a new password.">
        Forgot your password?
      </PageTitle>
      <ForgotPasswordForm />
      <p className="text-sm">
        Remembered it?{" "}
        <Link href="/login" className="link link-primary">
          Log in
        </Link>
      </p>
    </div>
  );
}
