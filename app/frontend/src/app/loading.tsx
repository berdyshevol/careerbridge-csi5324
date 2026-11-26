import Loading from "@/components/Loading";

// Next.js shows this inside the shared layout while a page's server data is on its way
export default function PageLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div aria-hidden="true" className="skeleton h-9 w-64 max-w-full" />
      <Loading />
    </div>
  );
}
