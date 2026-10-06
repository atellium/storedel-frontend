"use client";

import { useMemo, useState } from "react";
import { useProductCategories } from "@/features/product-categories/product-category-provider";

type ProductCategorySelectorProps = {
  value: number[];
  onChange: (value: number[]) => void;
  error?: string;
};

export function ProductCategorySelector({
  error,
  onChange,
  value,
}: ProductCategorySelectorProps) {
  const {
    categories,
    error: categoryError,
    getCategoryById,
    isLoading,
    refreshCategories,
    searchCategories,
  } = useProductCategories();
  const [query, setQuery] = useState("");
  const selectedCategories = value
    .map(getCategoryById)
    .filter((category) => category !== undefined);
  const results = useMemo(
    () =>
      searchCategories(query)
        .filter((category) => !value.includes(category.id))
        .slice(0, 8),
    [query, searchCategories, value],
  );

  return (
    <div>
      <label htmlFor="category-search" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
        Categories *
      </label>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 transition-colors focus-within:border-primary/50 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20">
        {selectedCategories.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onChange(value.filter((id) => id !== category.id))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold tracking-wide text-primary transition hover:bg-primary/20"
              >
                {category.name}
                <i className="fa-solid fa-xmark text-[10px]" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        <input
          id="category-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={isLoading ? "Loading categories..." : "Search categories"}
          className="h-9 w-full bg-transparent px-2 text-sm font-bold text-gray-900 outline-none placeholder:font-medium placeholder:text-gray-400"
        />
      </div>

      {categoryError && (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 border border-red-100">
          <span>Categories could not be loaded.</span>
          <button type="button" onClick={refreshCategories} className="text-primary hover:underline">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !categoryError && query.length > 0 && (
        <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
          {results.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {results.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    onChange([...value, category.id]);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-gray-50 active:bg-gray-100"
                >
                  <span className="text-sm font-bold text-gray-900">{category.name}</span>
                  <i className="fa-solid fa-plus text-[10px] text-gray-400" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <p className="px-3 py-4 text-center text-[11px] font-semibold text-gray-500">
              {categories.length === 0 ? "No categories available." : "No matching categories."}
            </p>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-[11px] font-semibold text-red-500">{error}</p>}
    </div>
  );
}