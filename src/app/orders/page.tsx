import { createPageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata = createPageMetadata({
  title: "Orders | Storedel",
  description: "View and manage your Storedel order history.",
  path: "/orders",
  noIndex: true,
});

export default function OrdersPage() {
  redirect("/");
}
