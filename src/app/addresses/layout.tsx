import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Saved Addresses | Storedel",
  description: "Manage your delivery addresses for Storedel orders.",
  path: "/addresses",
  noIndex: true,
});

export default function AddressesLayout({ children }: LayoutProps<"/addresses">) {
  return children;
}
