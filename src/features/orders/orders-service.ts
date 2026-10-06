import { privateApiClient } from "@/lib/api-client";
import type { UserAddress } from "@/features/addresses/address-service";

export type OrderStore = {
  id: string;
  name: string;
  slug: string;
};

export type OrderCustomer = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
};

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "rejected";

export type OrderFulfillmentType =
  | "scheduled_delivery"
  | "express_delivery"
  | "pickup";

export type OrderItem = {
  id: string;
  product: string;
  variant: string | null;
  selection_type: string;
  product_public_id: string;
  product_name: string;
  variant_name: string;
  measurement_type: string;
  measurement_value: number;
  unit: string;
  pack_count: number;
  quantity: number;
  unit_price: number;
  mrp: number | null;
  line_total: number;
  total_measurement_value: number;
  discount_amount: number;
  is_ready?: boolean;
  is_not_available?: boolean;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  address_id?: string;
  address?: UserAddress | null;
  delivery_address?: UserAddress | null;
  shipping_address?: UserAddress | null;
  order_number: string;
  store: OrderStore;
  customer?: OrderCustomer;
  status: OrderStatus;
  fullfillment_type: OrderFulfillmentType;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  not_available_amount: number;
  total_amount: number;
  customer_note: string;
  cancellation_reason: string;
  item_count: number;
  total_units: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

export type CreateOrderPayload = {
  add_with_existing: boolean;
  address_id?: string;
  cart_id: string;
  fullfillment_type: OrderFulfillmentType;
  delivery_fee: number;
  customer_note: string;
};

export type UpdateOrderPayload = {
  address_id?: string;
  customer_note?: string;
  delivery_fee?: number;
  discount_amount?: number;
  fullfillment_type?: OrderFulfillmentType;
  payment_type?: "cash" | "online";
  status?: OrderStatus;
};

export type OrderResponse = {
  order: Order;
};

export type OrdersResponse = {
  count: number;
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
    next_page: number | null;
    previous_page: number | null;
  };
  results: Order[];
};

export async function createOrderFromCart(payload: CreateOrderPayload) {
  const response = await privateApiClient.post<OrderResponse>(
    "/api/orders/from-cart/",
    payload,
  );

  return response.data.order;
}

export async function getOrders(storeSlug: string) {
  const response = await privateApiClient.get<OrdersResponse>(
    `/api/${storeSlug}/orders/`,
  );

  return response.data.results;
}

export async function updateOrder(
  orderNumber: string,
  payload: UpdateOrderPayload,
) {
  const response = await privateApiClient.patch<OrderResponse>(
    `/api/orders/${orderNumber}/`,
    payload,
  );

  return response.data.order;
}

export async function cancelOrder(
  orderNumber: string,
  cancellationReason: string,
) {
  const response = await privateApiClient.post<OrderResponse>(
    `/api/orders/${orderNumber}/cancel/`,
    {
      cancellation_reason: cancellationReason,
    },
  );

  return response.data.order;
}

export async function getStoreOrders({
  fullfillmentType,
  page,
  pageSize,
  status,
  storeSlug,
}: {
  fullfillmentType?: OrderFulfillmentType | "all";
  page: number;
  pageSize: number;
  status?: OrderStatus | "all";
  storeSlug: string;
}) {
  const response = await privateApiClient.get<OrdersResponse>(
    `/api/stores/my/${storeSlug}/orders/`,
    {
      params: {
        page,
        page_size: pageSize,
        ...(fullfillmentType && fullfillmentType !== "all"
          ? { fullfillment_type: fullfillmentType }
          : {}),
        ...(status && status !== "all" ? { status } : {}),
      },
    },
  );

  return response.data;
}

export async function getStoreOrder({
  orderId,
  storeSlug,
}: {
  orderId: string;
  storeSlug: string;
}) {
  const response = await privateApiClient.get<OrderResponse>(
    `/api/stores/my/${storeSlug}/orders/${orderId}/`,
  );

  return response.data.order;
}

export async function updateStoreOrderStatus({
  cancellationReason,
  orderId,
  status,
  storeSlug,
}: {
  cancellationReason?: string;
  orderId: string;
  status: OrderStatus;
  storeSlug: string;
}) {
  const response = await privateApiClient.patch<OrderResponse>(
    `/api/stores/my/${storeSlug}/orders/${orderId}/`,
    {
      status,
      ...(cancellationReason ? { cancellation_reason: cancellationReason } : {}),
    },
  );

  return response.data.order;
}

export async function updateStoreOrder({
  orderNumber,
  payload,
  storeSlug,
}: {
  orderNumber: string;
  payload: UpdateOrderPayload;
  storeSlug: string;
}) {
  const response = await privateApiClient.patch<OrderResponse>(
    `/api/stores/my/${storeSlug}/orders/${orderNumber}/`,
    payload,
  );

  return response.data.order;
}

export type UpdateStoreOrderItemPayload = {
  is_not_available?: boolean;
  is_ready?: boolean;
};

export async function updateStoreOrderItem({
  itemId,
  payload,
}: {
  itemId: string;
  payload: UpdateStoreOrderItemPayload;
}) {
  const response = await privateApiClient.patch<OrderResponse>(
    `/api/orders/items/${itemId}/`,
    payload,
  );

  return response.data.order;
}
