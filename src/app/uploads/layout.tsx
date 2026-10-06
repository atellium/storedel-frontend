import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Uploads | Storedel",
  description: "Manage uploads for your Storedel account.",
  path: "/uploads",
  noIndex: true,
});

export default function UploadsLayout({ children }: LayoutProps<"/uploads">) {
  return children;
}
