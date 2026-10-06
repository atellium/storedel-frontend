import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailsView } from "@/features/products/product-details-view";
import { getProductBySlug } from "@/features/stores/stores-service";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storedel.com";
const DEFAULT_OG_IMAGE = "/icons/app-icon.png";

export async function generateMetadata({
  params,
}: PageProps<"/product/[productSlug]">): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);

  if (!product) {
    return {
      title: "Product not found | Storedel",
      description: "This Storedel product could not be found.",
      robots: {
        follow: false,
        index: false,
      },
    };
  }

  const image = product.uploads?.[0]?.url || DEFAULT_OG_IMAGE;
  const description =
    product.short_description ||
    `Buy ${product.name}${product.store?.name ? ` from ${product.store.name}` : ""} on Storedel.`;
  const canonicalPath = `/product/${product.slug}`;

  return {
    title: `${product.name} | Storedel`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    keywords: [
      product.name,
      product.brand,
      product.store?.name,
      "Storedel",
      ...product.categories.map((category) => category.name),
    ].filter((keyword): keyword is string => Boolean(keyword)),
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title: `${product.name} | Storedel`,
      description,
      images: [
        {
          alt: product.name,
          url: image,
        },
      ],
      siteName: "Storedel",
      type: "website",
      url: canonicalPath,
    },
    twitter: {
      card: "summary_large_image",
      description,
      images: [image],
      title: `${product.name} | Storedel`,
    },
  };
}

export default async function ProductDetailsPage({
  params,
}: PageProps<"/product/[productSlug]">) {
  const { productSlug } = await params;
  const product = await getProductBySlug(productSlug);

  if (!product) notFound();

  return <ProductDetailsView product={product} />;
}
