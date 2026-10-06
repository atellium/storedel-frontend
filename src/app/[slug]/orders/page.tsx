import { OrdersView } from "@/features/orders/orders-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/orders">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "My Orders | Storedel",
    description: "Track orders placed with this Storedel store.",
    path: `/${slug}/orders`,
    noIndex: true,
  });
}

export default async function StoreOrdersPage({
  params,
}: PageProps<"/[slug]/orders">) {
  const { slug } = await params;

  return <OrdersView storeSlug={slug} />;
}
