import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/orders/[orderId]/preparing">) {
  const { orderId, slug } = await params;

  return createPageMetadata({
    title: `Prepare Order ${orderId} | Storedel`,
    description: "Prepare and manage this Storedel store order.",
    path: `/${slug}/manage/orders/${orderId}/preparing`,
    noIndex: true,
  });
}

export default async function StoreOrderPreparingPage({
  params,
}: PageProps<"/[slug]/manage/orders/[orderId]/preparing">) {
  const { orderId, slug } = await params;

  redirect(`/${slug}/manage/orders/${orderId}`);
}
