import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreDetailsView } from "@/features/stores/store-details-view";
import {
  getStoreBySlug,
  getStoreProducts,
} from "@/features/stores/stores-service";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storedel.com";
const DEFAULT_OG_IMAGE = "/icons/app-icon.png";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    return {
      title: "Store not found | Storedel",
      description: "This Storedel store could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const address = [
    store.address,
    store.locality,
    store.city.name,
    store.city.state.name,
    store.pincode,
  ]
    .filter(Boolean)
    .join(", ");
  const categories = store.categories.map((category) => category.name);
  const description = [
    `Shop from ${store.name} on Storedel.`,
    address ? `Serving ${address}.` : "",
    categories.length > 0 ? `Find ${categories.slice(0, 4).join(", ")} and more.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const image = store.cover_image || DEFAULT_OG_IMAGE;
  const canonicalPath = `/${store.slug}`;

  return {
    title: `${store.name} in ${store.locality} | Storedel`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    keywords: [
      store.name,
      "Storedel",
      "nearby stores",
      "grocery delivery",
      store.locality,
      store.city.name,
      ...categories,
    ].filter(Boolean),
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title: `${store.name} | Storedel`,
      description,
      url: canonicalPath,
      siteName: "Storedel",
      images: [
        {
          url: image,
          alt: store.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${store.name} | Storedel`,
      description,
      images: [image],
    },
  };
}

export default async function StoreDetailsPage({
  params,
}: PageProps<"/[slug]">) {
  const { slug } = await params;
  const [store, products] = await Promise.all([
    getStoreBySlug(slug),
    getStoreProducts(slug),
  ]);

  if (!store) notFound();

  return <StoreDetailsView products={products} store={store} />;
}

