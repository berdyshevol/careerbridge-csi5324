import LogInForm from "@/components/LogInForm";
import PageTitle from "@/components/PageTitle";
import { queryValue, viewPosting, type PageQuery } from "@/lib/api";

// A visitor sent here by Apply comes back to that posting, and the mockup visitor-login names it
async function postingToReturnTo(next: string | undefined) {
  const id = next?.match(/^\/jobs\/(\d+)(\/apply)?$/)?.[1];
  if (!id) {
    return null;
  }
  return viewPosting(id);
}

export default async function LogInPage({ searchParams }: { searchParams: Promise<PageQuery> }) {
  const next = queryValue((await searchParams).next);
  const posting = await postingToReturnTo(next);
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
    </div>
  );
}
