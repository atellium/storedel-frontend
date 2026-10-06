import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/dashboard">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Store Dashboard | Storedel",
    description: "Manage your Storedel store dashboard.",
    path: `/${slug}/dashboard`,
    noIndex: true,
  });
}

export default async function StoreDashboardPage({
  params,
}: PageProps<"/[slug]/dashboard">) {
  const { slug } = await params;

  redirect(`/${slug}/manage/dashboard`);
}
