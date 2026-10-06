import { OwnerBottomNav } from "@/components/owner-bottom-nav";
import { ManageStoreGuard } from "@/features/stores/manage-store-guard";

export default async function ManageLayout({
  children,
  params,
}: LayoutProps<"/[slug]/manage">) {
  const { slug } = await params;

  return (
    <ManageStoreGuard>
      <div className="[&_main]:box-border">
        {children}
      </div>
      <OwnerBottomNav storeSlug={slug} />
    </ManageStoreGuard>
  );
}
