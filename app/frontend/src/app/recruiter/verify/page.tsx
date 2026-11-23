import VerifyEmail from "@/components/VerifyEmail";
import { queryValue, type PageQuery } from "@/lib/api";

// UC-08 step 6: the page the verification email links to. Opening it is not the verification itself:
// the page asks the backend with a POST, because a GET changes nothing (ADR-0010).
export default async function VerifyRecruiterEmailPage({ searchParams }: { searchParams: Promise<PageQuery> }) {
  const token = queryValue((await searchParams).token) ?? "";
  return (
    <div className="mx-auto max-w-xl">
      <VerifyEmail token={token} />
    </div>
  );
}
