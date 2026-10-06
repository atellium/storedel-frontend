import { notFound } from "next/navigation";
import { StoreSearchView } from "@/features/stores/store-search-view";
import { getStoreBySlug } from "@/features/stores/stores-service";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/search">) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  return createPageMetadata({
    title: store ? `Search ${store.name} | Storedel` : "Store Search | Storedel",
    description: store
      ? `Search products available from ${store.name} on Storedel.`
      : "Search products from a Storedel store.",
    path: `/${slug}/search`,
  });
}

export default async function StoreSearchPage({
  params,
}: PageProps<"/[slug]/search">) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) notFound();

  return <StoreSearchView store={store} />;
}
