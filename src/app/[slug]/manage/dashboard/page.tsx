import { StoreDashboardView } from "@/features/stores/store-dashboard-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/dashboard">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Store Dashboard | Storedel",
    description: "Manage your Storedel store dashboard, orders, products, and settings.",
    path: `/${slug}/manage/dashboard`,
    noIndex: true,
  });
}

export default async function StoreDashboardPage({
  params,
}: PageProps<"/[slug]/manage/dashboard">) {
  const { slug } = await params;

  return <StoreDashboardView storeSlug={slug} />;
}
