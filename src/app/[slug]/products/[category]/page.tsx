import { notFound } from "next/navigation";
import { CategoryProductsView } from "@/features/stores/category-products-view";
import {
  getStoreBySlug,
  getStoreSettings,
  getStoreProductsResponse,
} from "@/features/stores/stores-service";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/products/[category]">) {
  const { category, slug } = await params;
  const [store, productsResponse] = await Promise.all([
    getStoreBySlug(slug),
    getStoreProductsResponse(slug, category),
  ]);
  const categoryName = productsResponse?.category?.display_name ??
    productsResponse?.category?.name ??
    category.replace(/-/g, " ");

  return createPageMetadata({
    title: store
      ? `${categoryName} from ${store.name} | Storedel`
      : `${categoryName} | Storedel`,
    description: store
      ? `Shop ${categoryName} from ${store.name} on Storedel.`
      : `Shop ${categoryName} from local stores on Storedel.`,
    path: `/${slug}/products/${category}`,
  });
}

export default async function StoreCategoryProductsPage({
  params,
}: PageProps<"/[slug]/products/[category]">) {
  const { category, slug } = await params;
  const [store, productsResponse, settings] = await Promise.all([
    getStoreBySlug(slug),
    getStoreProductsResponse(slug, category),
    getStoreSettings(slug),
  ]);

  if (!store) notFound();

  return (
    <CategoryProductsView
      category={productsResponse?.category ?? null}
      categorySlug={category}
      products={productsResponse?.results ?? []}
      store={store}
      settings={settings}
    />
  );
}
