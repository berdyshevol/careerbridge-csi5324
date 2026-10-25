import LogInForm from "@/components/LogInForm";
import { queryValue, type PageQuery } from "@/lib/api";

export default async function LogInPage({ searchParams }: { searchParams: Promise<PageQuery> }) {
  const { next } = await searchParams;
  return <LogInForm next={queryValue(next)} />;
}
