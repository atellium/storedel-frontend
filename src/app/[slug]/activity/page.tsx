import Link from "next/link";
import { StoreBottomNav } from "@/components/store-bottom-nav";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/activity">) {
  const { slug } = await params;

  return createPageMetadata({
    title: "Store Activity | Storedel",
    description: "View activity and order updates for this Storedel store.",
    path: `/${slug}/activity`,
    noIndex: true,
  });
}

export default async function StoreActivityPage({
  params,
}: PageProps<"/[slug]/activity">) {
  const { slug } = await params;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] pb-20 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="grid min-h-14 grid-cols-[auto_1fr] items-center gap-3 px-3 py-1.5">
          <Link
            href={`/${slug}`}
            aria-label="Back to home"
            className="inline-flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          </Link>
          <div className="min-w-0 text-left">
            <h1 className="text-base font-bold leading-tight text-gray-900">
              Activity
            </h1>
            <p className="truncate text-xs font-medium text-secondary">
              Updates from this store
            </p>
          </div>
        </div>
      </header>

      <section className="px-3 py-5">
        <Link
          href={`/${slug}/orders`}
          className="flex items-center justify-between gap-3 rounded-[20px] border border-gray-100 bg-white px-4 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition active:scale-[0.99]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <i className="fa-solid fa-receipt" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">My Orders</p>
              <p className="mt-1 truncate text-xs font-medium text-secondary">
                View orders placed with this store
              </p>
            </div>
          </div>
          <i className="fa-solid fa-chevron-right text-xs text-secondary" aria-hidden="true" />
        </Link>
      </section>

      <StoreBottomNav storeSlug={slug} />
    </main>
  );
}
