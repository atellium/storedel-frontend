import { StoreProductsManageView } from "@/features/stores/store-products-manage-view";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/products">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Manage Products | Storedel",
    description: "Manage products and catalog details for your Storedel store.",
    path: `/${slug}/manage/products`,
    noIndex: true,
  });
}

export default async function StoreProductsManagePage({
  params,
}: PageProps<"/[slug]/manage/products">) {
  const { slug } = await params;

  return <StoreProductsManageView storeSlug={slug} />;
}
