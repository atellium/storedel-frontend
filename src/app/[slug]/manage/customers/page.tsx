import { StoreCustomersView } from "@/features/stores/store-customers-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/customers">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Customers | Storedel",
    description: "Manage store customer settings and delivery rules.",
    path: `/${slug}/manage/customers`,
    noIndex: true,
  });
}

export default async function StoreCustomersPage({
  params,
}: PageProps<"/[slug]/manage/customers">) {
  const { slug } = await params;

  return <StoreCustomersView storeSlug={slug} />;
}
