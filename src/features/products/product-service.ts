import { privateApiClient } from "@/lib/api-client";
import type {
  BulkVariantResponse,
  ProductPayload,
  ProductResponse,
  ProductVariant,
  ProductVariantInput,
  VariantResponse,
} from "./types";
import type { StoreProduct } from "@/features/stores/types";

export async function createStoreProduct(storeSlug: string, payload: ProductPayload) {
  const response = await privateApiClient.post<ProductResponse>(
    `/api/stores/my/${storeSlug}/products/`,
    payload,
  );

  return unwrapProductResponse(response.data);
}

export async function getStoreProduct(storeSlug: string, productId: string) {
  const response = await privateApiClient.get<ProductResponse>(
    `/api/stores/my/${storeSlug}/products/${productId}/`,
  );

  return unwrapProductResponse(response.data);
}

export async function updateStoreProduct(
  storeSlug: string,
  productId: string,
  payload: ProductPayload,
) {
  const response = await privateApiClient.patch<ProductResponse>(
    `/api/stores/my/${storeSlug}/products/${productId}/`,
    payload,
  );

  return unwrapProductResponse(response.data);
}

export async function createProductVariants(
  storeSlug: string,
  productId: string,
  variants: ProductVariantInput[],
) {
  const response = await privateApiClient.post<BulkVariantResponse>(
    `/api/stores/my/${storeSlug}/products/${productId}/variants/`,
    { variants },
  );

  return response.data.results;
}

export async function updateProductVariants(
  storeSlug: string,
  productId: string,
  variants: ProductVariantInput[],
) {
  const response = await privateApiClient.patch<BulkVariantResponse>(
    `/api/stores/my/${storeSlug}/products/${productId}/variants/`,
    { variants },
  );

  return response.data.results;
}

export async function updateProductVariant(
  storeSlug: string,
  productId: string,
  variantId: string,
  payload: ProductVariantInput,
) {
  const response = await privateApiClient.patch<VariantResponse>(
    `/api/stores/my/${storeSlug}/products/${productId}/variants/${variantId}/`,
    payload,
  );

  return unwrapVariantResponse(response.data);
}

function unwrapProductResponse(response: ProductResponse): StoreProduct {
  if ("result" in response && response.result) return response.result;
  if ("product" in response && response.product) return response.product;
  if ("data" in response && response.data) return response.data;
  return response as StoreProduct;
}

function unwrapVariantResponse(response: VariantResponse): ProductVariant {
  if ("result" in response && response.result) return response.result;
  if ("variant" in response && response.variant) return response.variant;
  if ("data" in response && response.data) return response.data;
  return response as ProductVariant;
}
