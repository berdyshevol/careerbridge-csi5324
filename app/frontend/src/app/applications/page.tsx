import ApplicationsTracker from "@/components/ApplicationsTracker";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const parsedId = params?.applicationId ? Number(params.applicationId) : undefined;
  const initialApplicationId =
    parsedId !== undefined && Number.isFinite(parsedId) ? parsedId : undefined;

  return <ApplicationsTracker initialApplicationId={initialApplicationId} />;
}
