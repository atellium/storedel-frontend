import type { Metadata } from "next";
import { SavedStoresView } from "@/features/stores/saved-stores-view";
import { getStores } from "@/features/stores/stores-service";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storedel.com";
const DEFAULT_OG_IMAGE = "/icons/app-icon.png";

export const metadata: Metadata = {
  title: "Local Stores Near You | Order Online with Storedel",
  description:
    "Discover local stores on Storedel. Browse products, find your saved stores, and place pickup or delivery orders directly with nearby shops.",
  alternates: {
    canonical: "/stores",
  },
  keywords: [
    "Storedel stores",
    "local stores",
    "nearby stores",
    "grocery stores near me",
    "shop local",
    "online grocery",
    "neighborhood stores",
  ],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Discover Local Stores on Storedel",
    description:
      "Find local stores, browse their products, and order for pickup or delivery through Storedel.",
    url: "/stores",
    siteName: "Storedel",
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        alt: "Storedel",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Local Stores Near You | Storedel",
    description:
      "Search and shop from local stores near you with Storedel.",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default async function StoresPage() {
  const stores = await getStores();

  return <SavedStoresView stores={stores} />;
}
