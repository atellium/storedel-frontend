import { privateApiClient } from "@/lib/api-client";

export type CartStore = {
  id: string;
  name: string;
  slug: string;
};

export type CartItem = {
  id: string;
  product_id: string;
  product_name: string;
  measurement_type: string;
  quantity_step: number | null;
  unit: string;
  variant_id: string | null;
  custom_value: number | null;
  display_measurement: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  total_measurement_value: number;
  created_at: string;
  updated_at: string;
};

export type Cart = {
  id: string;
  store: CartStore;
  is_active: boolean;
  item_count: number;
  total_units: number;
  subtotal: number;
  items: CartItem[];
  created_at: string;
  updated_at: string;
};

export type CartResponse = {
  cart: Cart;
};

export type AddCartItemPayload = {
  product_id: string;
  quantity: number;
  variant_id?: string;
  custom_value?: number;
};

export type UpdateCartItemPayload = {
  quantity?: number;
  custom_value?: number;
};

export async function getStoreCart(storeSlug: string) {
  const response = await privateApiClient.get<CartResponse>(
    `/api/stores/${storeSlug}/cart/`,
  );

  return response.data.cart;
}

export async function addCartItem(storeSlug: string, payload: AddCartItemPayload) {
  console.log("Cart item add payload", payload);

  const response = await privateApiClient.post<CartResponse>(
    `/api/stores/${storeSlug}/cart/items/`,
    payload,
  );

  return response.data.cart;
}

export async function updateCartItem(
  itemId: string,
  payload: UpdateCartItemPayload,
) {
  console.log("Cart item update payload", payload);

  const response = await privateApiClient.patch<CartResponse>(
    `/api/cart/items/${itemId}/`,
    payload,
  );

  return response.data.cart;
}

export async function deleteCartItem(itemId: string) {
  const response = await privateApiClient.delete<CartResponse>(
    `/api/cart/items/${itemId}/`,
  );

  return response.data.cart;
}
