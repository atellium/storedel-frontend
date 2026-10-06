import { CheckoutView } from "@/features/orders/checkout-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/checkout">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Checkout | Storedel",
    description: "Complete your pickup or delivery order on Storedel.",
    path: `/${slug}/checkout`,
    noIndex: true,
  });
}

export default async function StoreCheckoutPage({
  params,
}: PageProps<"/[slug]/checkout">) {
  const { slug } = await params;

  return <CheckoutView storeSlug={slug} />;
}
