import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Storedel | Online Storefronts for Local Shops",
  description:
    "Create an online storefront, manage products, and accept pickup or delivery orders with Storedel.",
  path: "/",
});

export default function HomeLayout({ children }: { children: ReactNode }) {
  return children;
}
