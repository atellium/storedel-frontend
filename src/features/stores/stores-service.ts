import type {
  MyStoreDetails,
  SavedStore,
  SavedStoresResponse,
  SaveStoreResponse,
  StoreDetails,
  StoreDetailsResponse,
  StoreProductDetails,
  StoreProductsResponse,
  StoreProductDetailsResponse,
  StoreSettingsPayload,
  StoreSettingsResponse,
  StoresResponse,
} from "./types";
import { privateApiClient } from "@/lib/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

const LOCAL_API_HOST_PATTERN =
  /^(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/;

function allowInsecureLocalApiFetch(url: URL) {
  if (
    typeof window !== "undefined" ||
    process.env.NODE_ENV !== "development" ||
    url.protocol !== "https:" ||
    !LOCAL_API_HOST_PATTERN.test(url.hostname) ||
    process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0"
  ) {
    return;
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

async function fetchPublicApi(url: URL) {
  allowInsecureLocalApiFetch(url);

  return fetch(url, {
    cache: "no-store",
  });
}

type SavedStoresApiResponse = Partial<SavedStoresResponse> & {
  result?: SavedStore[];
};

export async function getStores(options: { search?: string } = {}) {
  if (!API_BASE_URL) return [];

  try {
    const url = new URL("/api/stores/", API_BASE_URL);
    if (options.search) url.searchParams.set("search", options.search);

    const response = await fetchPublicApi(url);

    if (!response.ok) return [];

    const data = (await response.json()) as StoresResponse;
    return data.results;
  } catch {
    return [];
  }
}

export async function getNearbyStores({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  if (!API_BASE_URL) return [];

  try {
    const url = new URL("/api/stores/nearby/", API_BASE_URL);
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lng", String(longitude));

    const response = await fetchPublicApi(url);

    if (!response.ok) return [];

    const data = (await response.json()) as StoresResponse;
    return data.results;
  } catch {
    return [];
  }
}

export async function getStoreBySlug(slug: string) {
  if (!API_BASE_URL) return null;

  try {
    const response = await fetchPublicApi(
      new URL(`/api/stores/${slug}/`, API_BASE_URL),
    );

    if (!response.ok) return null;

    const data = (await response.json()) as StoreDetailsResponse;
    return data.result;
  } catch {
    return null;
  }
}

export async function getStoreProducts(slug: string, category?: string) {
  const data = await getStoreProductsResponse(slug, category);
  return data?.results ?? [];
}

export async function getStoreProductsResponse(slug: string, category?: string) {
  if (!API_BASE_URL) return null;

  try {
    const url = new URL(`/api/stores/${slug}/products/`, API_BASE_URL);
    if (category) url.searchParams.set("category", category);

    const response = await fetchPublicApi(url);

    if (!response.ok) return null;

    const data = (await response.json()) as StoreProductsResponse;
    return data;
  } catch {
    return null;
  }
}

export async function getProductBySlug(productSlug: string) {
  if (!API_BASE_URL) return null;

  try {
    const response = await fetchPublicApi(
      new URL(`/api/product/${productSlug}/`, API_BASE_URL),
    );

    if (!response.ok) return null;

    const data = (await response.json()) as StoreProductDetailsResponse;
    return unwrapProductDetailsResponse(data);
  } catch {
    return null;
  }
}

export async function getStoreSettings(slug: string) {
  if (!API_BASE_URL) return null;

  try {
    const response = await fetchPublicApi(
      new URL(`/api/stores/${slug}/settings/`, API_BASE_URL),
    );

    if (!response.ok) return null;

    const data = (await response.json()) as StoreSettingsResponse;
    return data.result;
  } catch {
    return null;
  }
}

export async function getMyStoreSettings(slug: string) {
  const response = await privateApiClient.get<StoreSettingsResponse>(
    `/api/stores/my/${slug}/settings/`,
  );

  return response.data.result;
}

export async function saveMyStoreSettings(
  slug: string,
  payload: StoreSettingsPayload,
) {
  const response = await privateApiClient.patch<StoreSettingsResponse>(
    `/api/stores/my/${slug}/settings/`,
    payload,
  );

  return response.data.result;
}

export async function getMyStores() {
  const response = await privateApiClient.get<{
    count: number;
    pagination: StoresResponse["pagination"];
    result?: StoreDetails[];
    results: StoreDetails[];
  } | StoreDetails[]>("/api/stores/my/");

  if (Array.isArray(response.data)) return response.data;
  return response.data.results ?? response.data.result ?? [];
}

export async function getMyStoreBySlug(slug: string) {
  const response = await privateApiClient.get<{ result: MyStoreDetails }>(
    `/api/stores/my/${slug}/`,
  );

  return response.data.result;
}

export async function getMyStoreProducts(
  slug: string,
  page = 1,
  options: {
    category?: string;
    isFeatured?: boolean;
    isCustomQuantity?: boolean;
    pageSize?: number;
    search?: string;
  } = {},
) {
  const response = await privateApiClient.get<StoreProductsResponse>(
    `/api/stores/my/${slug}/products/`,
    {
      params: {
        page,
        ...(options.category ? { category: options.category } : {}),
        ...(options.isFeatured ? { is_featured: true } : {}),
        ...(options.isCustomQuantity ? { is_custom_quantity: true } : {}),
        ...(options.pageSize ? { page_size: options.pageSize } : {}),
        ...(options.search ? { search: options.search } : {}),
      },
    },
  );

  return response.data;
}

export async function getSavedStores(page = 1): Promise<SavedStoresResponse> {
  const response = await privateApiClient.get<
    SavedStoresApiResponse | SavedStore[]
  >(
    "/api/stores/saved/",
    {
      params: { page },
    },
  );

  const data = response.data;

  if (Array.isArray(data)) {
    return {
      count: data.length,
      pagination: emptyPagination(),
      results: data,
    };
  }

  return {
    count: data.count ?? data.result?.length ?? 0,
    pagination: data.pagination ?? emptyPagination(),
    results: data.results ?? data.result ?? [],
  };
}

function emptyPagination(): StoresResponse["pagination"] {
  return {
    has_next: false,
    has_previous: false,
    next_page: null,
    page: 1,
    page_size: 0,
    previous_page: null,
    total_items: 0,
    total_pages: 1,
  };
}

export async function saveStore(slug: string) {
  const response = await privateApiClient.post<SaveStoreResponse>(
    `/api/stores/${slug}/save/`,
  );

  return response.data;
}

export async function unsaveStore(slug: string) {
  const response = await privateApiClient.delete<SaveStoreResponse>(
    `/api/stores/${slug}/save/`,
  );

  return response.data;
}

function unwrapProductDetailsResponse(
  response: StoreProductDetailsResponse,
): StoreProductDetails {
  if ("result" in response && response.result) return response.result;
  if ("product" in response && response.product) return response.product;
  if ("data" in response && response.data) return response.data;
  return response as StoreProductDetails;
}
