import { StoreCustomerDetailsView } from "@/features/stores/store-customers-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/customers/[customerId]">) {
  const { customerId, slug } = await params;

  return createPageMetadata({
    title: "Customer Details | Storedel",
    description: "View and manage a customer profile and delivery settings.",
    path: `/${slug}/manage/customers/${customerId}`,
    noIndex: true,
  });
}

export default async function StoreCustomerDetailsPage({
  params,
}: PageProps<"/[slug]/manage/customers/[customerId]">) {
  const { customerId, slug } = await params;

  return <StoreCustomerDetailsView customerId={customerId} storeSlug={slug} />;
}
