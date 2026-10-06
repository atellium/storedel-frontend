import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/cart">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Cart | Storedel",
    description: "Review your cart before checkout on Storedel.",
    path: `/${slug}/cart`,
    noIndex: true,
  });
}

export default async function StoreCartPage({
  params,
}: PageProps<"/[slug]/cart">) {
  const { slug } = await params;

  redirect(`/${slug}/checkout`);
}
