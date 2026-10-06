"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { StoreBottomNav } from "@/components/store-bottom-nav";
import {
  normalizeCategorySearch,
  searchProductCategories,
} from "@/features/product-categories/category-search";
import type { StoreCategory, StoreDetails } from "./types";

const DEFAULT_CATEGORY_IMAGE = "/images/default_product.webp";

export function StoreSearchView({
  store,
}: {
  store: StoreDetails;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [storeCategories] = useState(() =>
    store.categories.filter((category) => category.slug),
  );
  const hasSearchQuery = query.trim().length > 0;
  const searchResults = useMemo(
    () => {
      if (!hasSearchQuery) return [];

      const normalizedQuery = normalizeCategorySearch(query);

      return searchProductCategories(storeCategories, query).sort((left, right) => {
        const leftStartsWith = normalizeCategorySearch(left.name).startsWith(
          normalizedQuery,
        );
        const rightStartsWith = normalizeCategorySearch(right.name).startsWith(
          normalizedQuery,
        );

        if (leftStartsWith !== rightStartsWith) return leftStartsWith ? -1 : 1;

        return left.sort_order - right.sort_order;
      });
    },
    [hasSearchQuery, query, storeCategories],
  );

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-white text-gray-900">
      <header className="sticky top-0 z-10 bg-white/95 px-3 py-2.5 backdrop-blur">
        <label
          htmlFor="store-category-search"
          className="flex h-14 w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-2 transition-all "
        >
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-black transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-lg" aria-hidden="true" />
          </button>
          <input
            ref={inputRef}
            id="store-category-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search in ${store.name}`}
            autoFocus
            className="min-w-0 flex-1 bg-transparent pl-1 pr-2 text-base font- text-gray-900 outline-none placeholder:text-gray-400"
          />
          {/* {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-200/60 text-gray-500 transition hover:bg-gray-200"
            >
              <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
            </button>
          )} */}
        </label>
      </header>

      <section className="px-3 pb-28 pt-2">
        {hasSearchQuery ? (
          searchResults.length > 0 ? (
            <div className="overflow-hidden rounded-xl bg-gray-50">
              {searchResults.map((category) => (
                <SearchResultRow
                  key={category.id}
                  category={category}
                  query={query}
                  storeSlug={store.slug}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-gray-50 px-4 py-10 text-center">
              <i
                className="fa-solid fa-magnifying-glass text-2xl text-gray-300"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-gray-900">
                No categories found
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Try searching by category name or alias.
              </p>
            </div>
          )
        ) : storeCategories.length > 0 ? (
          <>
            <h1 className="px-1 text-base font-bold text-gray-900">
              Popular Categories
            </h1>
            <div className="mt-3 flex flex-col">
              {storeCategories.map((category) => (
                <SearchCategoryRow
                  key={category.id}
                  category={category}
                  storeSlug={store.slug}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-xl bg-gray-50 px-4 py-10 text-center">
            <i
              className="fa-solid fa-layer-group text-2xl text-gray-300"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-semibold text-gray-900">
              No categories available
            </p>
          </div>
        )}
      </section>

      <StoreBottomNav storeSlug={store.slug} />
    </main>
  );
}

function SearchResultRow({
  category,
  query,
  storeSlug,
}: {
  category: StoreCategory;
  query: string;
  storeSlug: string;
}) {
  const aliases = category.aliases
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/${storeSlug}/products/${category.slug}`}
      className="flex items-center gap-3 px-3 py-2.5 transition-colors active:bg-gray-100"
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-white">
        <Image
          src={category.image_url || DEFAULT_CATEGORY_IMAGE}
          alt={category.name}
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[15px] font-semibold text-gray-900">
          <HighlightedCategoryName name={category.name} query={query} />
        </h2>
        {aliases && (
          <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
            {aliases}
          </p>
        )}
      </div>

      <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-gray-300" aria-hidden="true" />
    </Link>
  );
}

function HighlightedCategoryName({
  name,
  query,
}: {
  name: string;
  query: string;
}) {
  const normalizedName = normalizeCategorySearch(name);
  const normalizedQuery = normalizeCategorySearch(query);
  const matchIndex = normalizedQuery
    ? normalizedName.indexOf(normalizedQuery)
    : -1;

  if (matchIndex < 0) return name;

  const before = name.slice(0, matchIndex);
  const match = name.slice(matchIndex, matchIndex + normalizedQuery.length);
  const after = name.slice(matchIndex + normalizedQuery.length);

  return (
    <>
      <span>{before}</span>
      <span className="text-gray-400">{match}</span>
      <span>{after}</span>
    </>
  );
}

function SearchCategoryRow({
  category,
  storeSlug,
}: {
  category: StoreCategory;
  storeSlug: string;
}) {
  const aliases = category.aliases
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/${storeSlug}/products/${category.slug}`}
      className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors active:bg-gray-50"
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-gray-50">
        <Image
          src={category.image_url || DEFAULT_CATEGORY_IMAGE}
          alt={category.name}
          fill
          sizes="40px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-medium text-gray-800">{category.name}</h2>
        {aliases && (
          <p className="mt-0.5 truncate text-xs font-medium text-gray-400">
            {aliases}
          </p>
        )}
      </div>

      <i className="fa-solid fa-chevron-right text-[10px] text-gray-300" aria-hidden="true" />
    </Link>
  );
}
