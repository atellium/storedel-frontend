"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/features/auth/auth-guard";
import { getMyStoreBySlug, getMyStoreProducts } from "./stores-service";
import type { StoreCategory, StoreProduct, StoreProductsResponse } from "./types";

const PRODUCTS_PAGE_SIZE = 3;

export function StoreProductsManageView({ storeSlug }: { storeSlug: string }) {
  return (
    <AuthGuard>
      <StoreProductsManageContent storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function StoreProductsManageContent({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const [data, setData] = useState<StoreProductsResponse | null>(null);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [category, setCategory] = useState("");
  const [customQuantityOnly, setCustomQuantityOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  useEffect(() => {
    let isMounted = true;

    getMyStoreProducts(storeSlug, page, {
      category,
      isCustomQuantity: customQuantityOnly,
      pageSize: PRODUCTS_PAGE_SIZE,
      search: search.trim(),
    })
      .then((nextData) => {
        if (!isMounted) return;
        setData(nextData);
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [category, customQuantityOnly, page, search, storeSlug]);

  useEffect(() => {
    let isMounted = true;

    getMyStoreBySlug(storeSlug)
      .then((store) => {
        if (!isMounted) return;
        setCategories(store.categories ?? []);
      })
      .catch(() => {
        if (!isMounted) return;
        setCategories([]);
      });

    return () => {
      isMounted = false;
    };
  }, [storeSlug]);

  const products = useMemo(() => data?.results ?? [], [data]);
  const pagination = data?.pagination;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    setStatus("loading");
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
    setStatus("loading");
  };

  const handleCustomQuantityChange = (enabled: boolean) => {
    setCustomQuantityOnly(enabled);
    setPage(1);
    setStatus("loading");
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900 pb-20">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex h-10 items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-base" aria-hidden="true" />
          </button>

          <h1 className="text-base font-bold text-gray-900">
            Products
          </h1>

          <Link
            href={`/${storeSlug}`}
            aria-label="Public store"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-primary transition active:scale-95"
          >
            <i className="fa-solid fa-store text-sm" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="px-4 py-6">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Store Manager
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black tracking-tight text-gray-900">
              Products
            </h2>
            <Link
              href={`/${storeSlug}/manage/products/add`}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98]"
            >
              + Add Product
            </Link>
          </div>
        </div>

        <div className="mb-3">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-gray-100 bg-white px-3 focus-within:border-primary">
            <i className="fa-solid fa-magnifying-glass text-xs text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search products"
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
            />
          </label>
        </div>

        <div className="mb-4">
          <h3 className="mb-2 pl-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Filter
          </h3>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <label className="min-w-[220px] shrink-0">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                By category
              </span>
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(event) => handleCategoryChange(event.target.value)}
                  className="h-11 min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary"
                >
                  <option value="">All categories</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {category && (
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("")}
                    aria-label="Clear category filter"
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-500 transition active:scale-95"
                  >
                    <i className="fa-solid fa-xmark text-sm" aria-hidden="true" />
                  </button>
                )}
              </div>
            </label>

            <div className="flex min-w-[220px] shrink-0 items-end gap-2">
              <button
                type="button"
                onClick={() => handleCustomQuantityChange(!customQuantityOnly)}
                aria-pressed={customQuantityOnly}
                className={`inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-2xl border px-3 text-xs font-extrabold uppercase transition active:scale-95 ${
                  customQuantityOnly
                    ? "border-primary bg-primary text-white"
                    : "border-gray-100 bg-white text-gray-700"
                }`}
              >
                Custom quantity enabled
              </button>
              {customQuantityOnly && (
                <button
                  type="button"
                  onClick={() => handleCustomQuantityChange(false)}
                  aria-label="Clear custom quantity filter"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-500 transition active:scale-95"
                >
                  <i className="fa-solid fa-xmark text-sm" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {status === "loading" && (
          <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-8 text-center text-sm font-medium text-gray-500 shadow-sm">
            Loading catalog...
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-8 text-center text-sm font-medium text-red-500 shadow-sm">
            Could not load products.
          </div>
        )}

        {status === "idle" && (
          <div className="mt-4 space-y-3">
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.map((product) => (
                  <ManagedProductRow
                    key={product.id}
                    product={product}
                    storeSlug={storeSlug}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[20px] border border-gray-100 bg-white px-6 py-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <div className="flex size-14 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                  <i className="fa-solid fa-box-open text-xl" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm font-bold text-gray-900">
                  No products found
                </p>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  Products added to this store will appear here.
                </p>
              </div>
            )}

            {/* Premium Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-between rounded-[20px] border border-gray-100 bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <button
                  type="button"
                  onClick={() => {
                    setStatus("loading");
                    setPage(pagination.previous_page ?? page - 1);
                  }}
                  disabled={!pagination.has_previous}
                  className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-700 transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  <i className="fa-solid fa-chevron-left mr-2 text-[10px]" /> Prev
                </button>

                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Page <span className="text-gray-900">{pagination.page}</span> of {pagination.total_pages}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setStatus("loading");
                    setPage(pagination.next_page ?? page + 1);
                  }}
                  disabled={!pagination.has_next}
                  className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-xl bg-primary px-4 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  Next <i className="fa-solid fa-chevron-right ml-2 text-[10px]" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function ManagedProductRow({
  product,
  storeSlug,
}: {
  product: StoreProduct;
  storeSlug: string;
}) {
  const image = product.uploads?.[0];
  const activeVariants = product.variants.filter((variant) => variant.is_active);
  const defaultVariant =
    activeVariants.find((variant) => variant.is_default) ?? activeVariants[0];
  const categoryNames = product.categories.map((category) => category.name).join(", ");
  const discountPercent = defaultVariant ? getDiscountPercent(defaultVariant) : 0;
  const hasDiscount = discountPercent > 0;

  return (
    <article className="relative flex flex-col gap-3 overflow-hidden rounded-[20px] border border-gray-100 bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">

      <div className="flex gap-3">
        <div className={`relative flex size-[84px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] ${image?.url ? "" : "border border-gray-100/60 bg-gray-50"}`}>
          {image?.url ? (
            <Image
              src={image.url}
              alt={image.title || product.name}
              fill
              sizes="84px"
              className="rounded-[14px] object-cover"
            />
          ) : (
            <i className="fa-solid fa-box-open text-2xl text-gray-200" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 pr-1">
              <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-900">
                {product.name}
              </h3>
              <p className="mt-0.5 truncate text-[11px] font-medium text-gray-500">
                {[product.brand, categoryNames].filter(Boolean).join(" • ") || "Uncategorized"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${product.is_active
                  ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20"
                  : "bg-gray-50 text-gray-500 ring-1 ring-gray-200"
                }`}
            >
              {product.is_active ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="mt-2.5 flex items-end justify-between">
            {defaultVariant ? (
              <div>
                <p className="flex flex-wrap items-baseline gap-1.5">
                  <span className="text-sm font-extrabold text-gray-900">
                    {formatPrice(defaultVariant.price)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-[10px] font-semibold text-gray-400 line-through">
                        {formatPrice(defaultVariant.mrp ?? 0)}
                      </span>
                      <span className="rounded bg-blue-600 px-1 py-0.5 text-[8px] font-bold text-white shadow-sm">
                        {discountPercent}% OFF
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-gray-500">
                  {getVariantMeasurement(defaultVariant)}
                  {activeVariants.length > 1 && <span className="ml-1 text-primary">+{activeVariants.length - 1} Options</span>}
                </p>
              </div>
            ) : (
              <p className="text-[11px] font-semibold text-red-500">
                No active variants
              </p>
            )}

            <Link
              href={`/${storeSlug}/manage/products/${product.id}/edit`}
              className="inline-flex h-[34px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary bg-white px-4 text-[10px] font-bold uppercase tracking-wider text-primary transition active:scale-95 hover:bg-primary/5"
            >
              <i className="fa-solid fa-pencil text-[10px]" aria-hidden="true" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {product.allow_custom_quantity && (
        <div className="rounded-lg bg-primary/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          <i className="fa-solid fa-scale-balanced mr-1.5 opacity-70" />
          Custom quantity enabled
        </div>
      )}
    </article>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(price);
}

function getDiscountPercent(variant: StoreProduct["variants"][number]) {
  if (!variant.mrp || variant.mrp <= variant.price) return 0;
  return Math.round(((variant.mrp - variant.price) / variant.mrp) * 100);
}

function getVariantMeasurement(variant: StoreProduct["variants"][number]) {
  if (variant.name) return variant.name;

  if (variant.pack_count > 1) {
    return `${variant.display_measurement} x ${variant.pack_count}`;
  }

  return variant.display_measurement;
}
