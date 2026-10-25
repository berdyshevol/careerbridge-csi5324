import RegisterForm from "@/components/RegisterForm";
import { queryValue, type PageQuery } from "@/lib/api";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<PageQuery> }) {
  const { next } = await searchParams;
  return <RegisterForm next={queryValue(next)} />;
}
