import { StoreOrdersView } from "@/features/orders/store-orders-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/orders">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Manage Orders | Storedel",
    description: "Manage customer orders for your Storedel store.",
    path: `/${slug}/manage/orders`,
    noIndex: true,
  });
}

export default async function StoreOrdersPage({
  params,
}: PageProps<"/[slug]/manage/orders">) {
  const { slug } = await params;

  return <StoreOrdersView storeSlug={slug} />;
}
