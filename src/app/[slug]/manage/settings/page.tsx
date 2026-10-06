import { StoreSettingsMenuView } from "@/features/stores/store-settings-menu-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/settings">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Store Settings | Storedel",
    description: "Manage settings for your Storedel store.",
    path: `/${slug}/manage/settings`,
    noIndex: true,
  });
}

export default async function StoreSettingsPage({
  params,
}: PageProps<"/[slug]/manage/settings">) {
  const { slug } = await params;

  return <StoreSettingsMenuView storeSlug={slug} />;
}
