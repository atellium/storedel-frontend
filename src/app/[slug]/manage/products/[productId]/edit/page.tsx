import { ProductFormPage } from "@/features/products/components/product-form";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/products/[productId]/edit">) {
  const { productId, slug } = await params;

  return createPageMetadata({
    title: "Edit Product | Storedel",
    description: "Edit product details for your Storedel store.",
    path: `/${slug}/manage/products/${productId}/edit`,
    noIndex: true,
  });
}

export default async function EditProductPage({
  params,
}: PageProps<"/[slug]/manage/products/[productId]/edit">) {
  const { slug, productId } = await params;

  return <ProductFormPage mode="edit" productId={productId} storeSlug={slug} />;
}
