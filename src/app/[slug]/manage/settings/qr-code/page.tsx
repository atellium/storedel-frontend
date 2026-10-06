import { StoreQrCodeSettingsView } from "@/features/stores/store-qr-code-settings-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/settings/qr-code">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Store QR Code | Storedel",
    description: "Download a QR code for your Storedel store page.",
    path: `/${slug}/manage/settings/qr-code`,
    noIndex: true,
  });
}

export default async function StoreQrCodeSettingsPage({
  params,
}: PageProps<"/[slug]/manage/settings/qr-code">) {
  const { slug } = await params;

  return <StoreQrCodeSettingsView storeSlug={slug} />;
}
