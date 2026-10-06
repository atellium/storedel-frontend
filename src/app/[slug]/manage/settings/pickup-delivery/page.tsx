import { StorePickupDeliverySettingsView } from "@/features/stores/store-settings-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/settings/pickup-delivery">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Pickup & Delivery Settings | Storedel",
    description: "Manage pickup and delivery settings for your Storedel store.",
    path: `/${slug}/manage/settings/pickup-delivery`,
    noIndex: true,
  });
}

export default async function StorePickupDeliverySettingsPage({
  params,
}: PageProps<"/[slug]/manage/settings/pickup-delivery">) {
  const { slug } = await params;

  return <StorePickupDeliverySettingsView storeSlug={slug} />;
}
