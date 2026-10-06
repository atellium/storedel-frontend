import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storedel.com";
const DEFAULT_OG_IMAGE = "/icons/app-icon.png";

export function createPageMetadata({
  description,
  noIndex = false,
  path,
  title,
}: {
  description: string;
  noIndex?: boolean;
  path: string;
  title: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title,
      description,
      url: path,
      siteName: "Storedel",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          alt: "Storedel",
        },
      ],
      type: "website",
    },
    robots: noIndex
      ? {
          follow: false,
          index: false,
        }
      : undefined,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
