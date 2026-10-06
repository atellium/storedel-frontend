import { publicApiClient } from "@/lib/api-client";
import type { ProductCategoryFlatResponse } from "@/features/products/types";

export async function getFlatProductCategories() {
  const response = await publicApiClient.get<ProductCategoryFlatResponse>(
    "/api/product-categories/flat/",
  );

  return response.data;
}
