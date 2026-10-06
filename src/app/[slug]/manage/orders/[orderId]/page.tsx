import { StoreOrderDetailsView } from "@/features/orders/store-order-details-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/orders/[orderId]">) {
  const { orderId, slug } = await params;

  return createPageMetadata({
    title: `Order ${orderId} | Storedel`,
    description: "Review and manage this Storedel store order.",
    path: `/${slug}/manage/orders/${orderId}`,
    noIndex: true,
  });
}

export default async function StoreOrderDetailsPage({
  params,
}: PageProps<"/[slug]/manage/orders/[orderId]">) {
  const { orderId, slug } = await params;

  return <StoreOrderDetailsView orderNumber={orderId} storeSlug={slug} />;
}
