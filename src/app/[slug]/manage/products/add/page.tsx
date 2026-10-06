import { ProductFormPage } from "@/features/products/components/product-form";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/manage/products/add">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Add Product | Storedel",
    description: "Add a new product to your Storedel store.",
    path: `/${slug}/manage/products/add`,
    noIndex: true,
  });
}

export default async function AddProductPage({
  params,
}: PageProps<"/[slug]/manage/products/add">) {
  const { slug } = await params;

  return <ProductFormPage mode="create" storeSlug={slug} />;
}
