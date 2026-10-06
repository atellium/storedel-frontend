"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ProductCategory,
  ProductCategoryFlatResponse,
} from "@/features/products/types";
import { searchProductCategories } from "./category-search";
import { getFlatProductCategories } from "./product-categories-service";

type ProductCategoryContextValue = {
  data: ProductCategoryFlatResponse;
  categories: ProductCategory[];
  isLoading: boolean;
  error: Error | null;
  searchCategories: (query: string) => ProductCategory[];
  getCategoryById: (id: number) => ProductCategory | undefined;
  refreshCategories: () => Promise<void>;
};

const emptyCategoryResponse: ProductCategoryFlatResponse = { results: [] };
const ProductCategoryContext = createContext<ProductCategoryContextValue | null>(null);

export function ProductCategoryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProductCategoryFlatResponse>(emptyCategoryResponse);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextData = await getFlatProductCategories();
      setData(nextData);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError
          : new Error("Could not load product categories."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getFlatProductCategories()
      .then((nextData) => {
        if (!isMounted) return;
        setData(nextData);
      })
      .catch((nextError) => {
        if (!isMounted) return;
        setError(
          nextError instanceof Error
            ? nextError
            : new Error("Could not load product categories."),
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = data.results;
  const getCategoryById = useCallback(
    (id: number) => categories.find((category) => category.id === id),
    [categories],
  );
  const searchCategories = useCallback(
    (query: string) => searchProductCategories(categories, query),
    [categories],
  );
  const value = useMemo(
    () => ({
      data,
      categories,
      error,
      getCategoryById,
      isLoading,
      refreshCategories,
      searchCategories,
    }),
    [
      categories,
      data,
      error,
      getCategoryById,
      isLoading,
      refreshCategories,
      searchCategories,
    ],
  );

  return (
    <ProductCategoryContext.Provider value={value}>
      {children}
    </ProductCategoryContext.Provider>
  );
}

export function useProductCategories() {
  const value = useContext(ProductCategoryContext);

  if (!value) {
    throw new Error("useProductCategories must be used inside ProductCategoryProvider.");
  }

  return value;
}
