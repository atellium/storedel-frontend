import { OrderSuccessView } from "@/features/orders/order-success-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/orders/[orderId]/success">) {
  const { orderId, slug } = await params;

  return createPageMetadata({
    title: `Order ${orderId} Confirmed | Storedel`,
    description: "Your Storedel order was placed successfully.",
    path: `/${slug}/orders/${orderId}/success`,
    noIndex: true,
  });
}

export default async function OrderSuccessPage({
  params,
}: PageProps<"/[slug]/orders/[orderId]/success">) {
  const { orderId, slug } = await params;

  return <OrderSuccessView orderNumber={orderId} storeSlug={slug} />;
}
