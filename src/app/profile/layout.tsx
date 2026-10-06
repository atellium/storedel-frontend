import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Profile | Storedel",
  description: "View your Storedel profile, saved stores, and account options.",
  path: "/profile",
  noIndex: true,
});

export default function ProfileLayout({ children }: LayoutProps<"/profile">) {
  return children;
}
