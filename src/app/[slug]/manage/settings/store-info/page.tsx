import { StoreInfoSettingsView } from "@/features/stores/store-info-settings-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/settings/store-info">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Store Info Settings | Storedel",
    description: "View store information and request changes for your Storedel store.",
    path: `/${slug}/manage/settings/store-info`,
    noIndex: true,
  });
}

export default async function StoreInfoSettingsPage({
  params,
}: PageProps<"/[slug]/manage/settings/store-info">) {
  const { slug } = await params;

  return <StoreInfoSettingsView storeSlug={slug} />;
}
