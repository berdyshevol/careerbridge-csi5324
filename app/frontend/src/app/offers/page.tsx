import OfferResponseView from "@/components/OfferResponseView";

export default async function OffersPage({
  searchParams,
}: {
  searchParams?: Promise<{ applicationId?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const parsedId = params?.applicationId ? Number(params.applicationId) : undefined;
  const initialApplicationId =
    parsedId !== undefined && Number.isFinite(parsedId) ? parsedId : undefined;

  return <OfferResponseView initialApplicationId={initialApplicationId} />;
}
