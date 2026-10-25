import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { queryValue, type PageQuery } from "@/lib/api";
import { serverSession } from "@/lib/serverSession";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<PageQuery> }) {
  // UC-02 precondition: the visitor is not logged in
  if (await serverSession()) {
    redirect("/profile");
  }
  const { next } = await searchParams;
  return <RegisterForm next={queryValue(next)} />;
}
