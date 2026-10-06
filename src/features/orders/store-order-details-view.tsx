"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BottomSheetModal } from "@/components/modals";
import { AuthGuard } from "@/features/auth/auth-guard";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/ui-slice";
import {
  getStoreOrder,
  updateStoreOrder,
  updateStoreOrderItem,
  updateStoreOrderStatus,
  type Order,
  type OrderFulfillmentType,
  type OrderItem,
  type OrderStatus,
  type UpdateStoreOrderItemPayload,
} from "./orders-service";

export function StoreOrderDetailsView({
  orderNumber,
  storeSlug,
}: {
  orderNumber: string;
  storeSlug: string;
}) {
  return (
    <AuthGuard>
      <StoreOrderDetailsContent orderNumber={orderNumber} storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function StoreOrderDetailsContent({
  orderNumber,
  storeSlug,
}: {
  orderNumber: string;
  storeSlug: string;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [updating, setUpdating] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"cash" | "online">("cash");
  const [reason, setReason] = useState("");
  const [updatingItemAction, setUpdatingItemAction] = useState<string | null>(null);
  const [removingDeliveryCharge, setRemovingDeliveryCharge] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getStoreOrder({ orderId: orderNumber, storeSlug })
      .then((nextOrder) => {
        if (!isMounted) return;
        setOrder(nextOrder);
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [orderNumber, storeSlug]);

  const handleItemUpdate = async ({
    action,
    item,
    payload,
    successMessage,
  }: {
    action: "available" | "ready";
    item: OrderItem;
    payload: UpdateStoreOrderItemPayload;
    successMessage: string;
  }) => {
    const actionId = `${item.id}:${action}`;
    if (updatingItemAction || !canWriteOrder(order)) return;

    setUpdatingItemAction(actionId);

    try {
      const updatedOrder = await updateStoreOrderItem({
        itemId: item.id,
        payload,
      });
      setOrder(updatedOrder);
      dispatch(
        showToast({
          title: "Item updated",
          message: successMessage,
          type: "success",
        }),
      );
    } catch {
      dispatch(
        showToast({
          title: "Could not update item",
          message: "Please check your connection and try again.",
          type: "error",
        }),
      );
    } finally {
      setUpdatingItemAction(null);
    }
  };

  const handleMarkReady = async () => {
    if (!order || updating || !canWriteOrder(order)) return;

    setUpdating(true);

    try {
      const discountValue = parseAmount(discountAmount);
      const updatedOrder = await updateStoreOrder({
        orderNumber: order.order_number,
        payload: {
          ...(order.address_id ? { address_id: order.address_id } : {}),
          customer_note: order.customer_note,
          delivery_fee: order.delivery_fee,
          fullfillment_type: order.fullfillment_type,
          status: "ready",
          ...(discountValue > 0 ? { discount_amount: discountValue } : {}),
        },
        storeSlug,
      });
      setOrder(updatedOrder);
      dispatch(
        showToast({
          title: "Order ready",
          message: `Order ${updatedOrder.order_number} was marked ready.`,
          type: "success",
        }),
      );
    } catch {
      dispatch(
        showToast({
          title: "Could not update order",
          message: "Please check your connection and try again.",
          type: "error",
        }),
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveDeliveryCharge = async () => {
    if (!order || order.delivery_fee <= 0 || removingDeliveryCharge || !canWriteOrder(order)) {
      return;
    }

    setRemovingDeliveryCharge(true);

    try {
      const updatedOrder = await updateStoreOrder({
        orderNumber: order.order_number,
        payload: {
          ...(order.address_id ? { address_id: order.address_id } : {}),
          customer_note: order.customer_note,
          delivery_fee: 0,
          fullfillment_type: order.fullfillment_type,
          status: order.status,
        },
        storeSlug,
      });
      setOrder(updatedOrder);
      dispatch(
        showToast({
          title: "Delivery charge removed",
          message: `Order ${updatedOrder.order_number} was updated.`,
          type: "success",
        }),
      );
    } catch {
      dispatch(
        showToast({
          title: "Could not remove delivery charge",
          message: "Please check your connection and try again.",
          type: "error",
        }),
      );
    } finally {
      setRemovingDeliveryCharge(false);
    }
  };

  const handleSaveDiscount = async () => {
    if (!order || updating || !canWriteOrder(order)) return;

    const discountValue = parseAmount(discountAmount);
    if (discountValue <= 0) {
      dispatch(
        showToast({
          title: "Discount required",
          message: "Enter a discount amount before saving.",
          type: "error",
        }),
      );
      return;
    }

    setUpdating(true);

    try {
      const updatedOrder = await updateStoreOrder({
        orderNumber: order.order_number,
        payload: {
          ...(order.address_id ? { address_id: order.address_id } : {}),
          customer_note: order.customer_note,
          delivery_fee: order.delivery_fee,
          discount_amount: discountValue,
          fullfillment_type: order.fullfillment_type,
          status: order.status,
        },
        storeSlug,
      });
      setOrder(updatedOrder);
      setDiscountOpen(false);
      dispatch(
        showToast({
          title: "Discount saved",
          message: `Order ${updatedOrder.order_number} was updated.`,
          type: "success",
        }),
      );
    } catch {
      dispatch(
        showToast({
          title: "Could not save discount",
          message: "Please check your connection and try again.",
          type: "error",
        }),
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!order || updating) return;

    const cancellationReason = reason.trim();
    if (!cancellationReason) {
      dispatch(
        showToast({
          title: "Reason required",
          message: "Add a rejection reason before continuing.",
          type: "error",
        }),
      );
      return;
    }

    setUpdating(true);

    try {
      const updatedOrder = await updateStoreOrderStatus({
        cancellationReason,
        orderId: order.id,
        status: "rejected",
        storeSlug,
      });
      setOrder(updatedOrder);
      setRejectOpen(false);
      dispatch(
        showToast({
          title: "Order rejected",
          message: `Order ${updatedOrder.order_number} was rejected.`,
          type: "success",
        }),
      );
    } catch {
      dispatch(
        showToast({
          title: "Could not reject order",
          message: "Please check your connection and try again.",
          type: "error",
        }),
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async () => {
    if (!order || updating) return;

    setUpdating(true);

    try {
      const discountValue = parseAmount(discountAmount);
      const updatedOrder = await updateStoreOrder({
        orderNumber: order.order_number,
        payload: {
          ...(order.address_id ? { address_id: order.address_id } : {}),
          customer_note: order.customer_note,
          delivery_fee: order.delivery_fee,
          discount_amount: discountValue > 0 ? discountValue : order.discount_amount,
          fullfillment_type: order.fullfillment_type,
          payment_type: paymentType,
          status: "completed",
        },
        storeSlug,
      });
      setOrder(updatedOrder);
      setCompleteOpen(false);
      dispatch(
        showToast({
          title: "Order completed",
          message: `Payment marked as ${paymentType}.`,
          type: "success",
        }),
      );
    } catch {
      dispatch(
        showToast({
          title: "Could not complete order",
          message: "Please check your connection and try again.",
          type: "error",
        }),
      );
    } finally {
      setUpdating(false);
    }
  };

  const canEditOrder = canWriteOrder(order);
  const deliveryAddress = order ? getOrderDeliveryAddress(order) : null;
  const enteredDiscountAmount = parseAmount(discountAmount);
  const visibleDiscountAmount = enteredDiscountAmount > 0
    ? enteredDiscountAmount
    : order?.discount_amount ?? 0;
  const visibleTotalAmount = order
    ? Math.max(0, order.total_amount + order.discount_amount - visibleDiscountAmount)
    : 0;
  const showActionBottomBar =
    order?.status === "placed" ||
    order?.status === "accepted" ||
    order?.status === "preparing" ||
    order?.status === "ready";

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] pb-28 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex h-10 items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-base" aria-hidden="true" />
          </button>
          <h1 className="text-base font-bold text-gray-900">
            Order Details
          </h1>
          <Link
            href={`/${storeSlug}/manage/orders`}
            aria-label="Orders"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-primary shadow-sm transition active:scale-95"
          >
            <i className="fa-solid fa-receipt text-sm" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="px-4 py-5">
        {status === "loading" && (
          <div className="rounded-[20px] border border-gray-100 bg-white px-4 py-8 text-center text-sm font-medium text-gray-500 shadow-sm">
            Loading order details...
          </div>
        )}

        {status === "error" && (
          <div className="rounded-[20px] border border-red-100 bg-red-50 px-4 py-8 text-center text-sm font-bold text-red-500 shadow-sm">
            Could not load order details.
          </div>
        )}

        {status === "idle" && order && (
          <div className="space-y-4">

            {/* Main Order Overview Card */}
            <article className="overflow-hidden rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[22px] font-black tracking-tight text-gray-900">
                      #{order.order_number}
                    </h2>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider ${getFulfillmentColor(order.fullfillment_type)}`}>
                      {formatFulfillmentType(order.fullfillment_type)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-gray-500">
                    {formatDate(order.created_at)} at {formatTime(order.created_at)}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-[22px] font-black text-gray-900">
                    {formatPrice(order.total_amount)}
                  </p>
                  <span className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
              </div>
            </article>

            {(order.customer || deliveryAddress) && (
              <div className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                {order.customer && (
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-100">
                        <i className="fa-solid fa-user text-[13px]" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-extrabold text-gray-900">
                          {order.customer.full_name}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Customer</p>
                      </div>
                    </div>
                    {order.customer.phone && (
                      <a
                        href={`tel:${getDialablePhone(order.customer.phone)}`}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-50 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 ring-1 ring-gray-200 transition active:scale-95 hover:text-primary"
                      >
                        <i className="fa-solid fa-phone text-[11px]" aria-hidden="true" />
                        Call
                      </a>
                    )}
                  </div>
                )}
                {deliveryAddress && (
                  <div className="border-t border-gray-100 p-4">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <i className="fa-solid fa-location-dot text-sm" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          Delivery address
                        </p>
                        <p className="mt-0.5 text-[13px] font-extrabold text-gray-900">
                          {deliveryAddress.recipient_name}
                        </p>
                      </div>
                    </div>
                    <p className="text-[12px] font-semibold text-gray-500">
                      {deliveryAddress.phone}
                    </p>
                    <p className="mt-2 text-[13px] font-medium leading-5 text-gray-700">
                      {deliveryAddress.full_address}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pick & Pack Items */}
            <div className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                <div>
                  <h2 className="text-[14px] font-extrabold text-gray-900">Order Items</h2>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pick & Pack</p>
                </div>
                <span className="flex h-6 items-center justify-center rounded-full bg-gray-200/60 px-2.5 text-[11px] font-extrabold text-gray-600">
                  {order.items.length} Items
                </span>
              </div>
              <div className="divide-y divide-gray-50 px-4">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-900">
                          {item.product_name}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-gray-500">
                          {item.variant_name} <span className="mx-1 text-gray-300">×</span> {item.quantity}
                        </p>
                      </div>
                      <p className={`shrink-0 text-[13px] font-extrabold text-gray-900 ${item.is_not_available ? "text-gray-400 line-through" : ""}`}>
                        {formatPrice(item.line_total)}
                      </p>
                    </div>
                    <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-dashed border-gray-100 pt-2.5">
                      {item.is_ready ? (
                        <div className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-500/20">
                          <i className="fa-solid fa-check text-[10px]" aria-hidden="true" />
                          <span>Packed Ready</span>
                        </div>
                      ) : item.is_not_available ? (
                        <div className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-red-50 px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-red-600 ring-1 ring-red-500/20">
                          <i className="fa-solid fa-xmark text-[10px]" aria-hidden="true" />
                          <span>Unavailable</span>
                        </div>
                      ) : canEditOrder ? (
                        <>
                          <button
                            type="button"
                            disabled={Boolean(updatingItemAction)}
                            onClick={() =>
                              handleItemUpdate({
                                action: "available",
                                item,
                                payload: { is_not_available: true },
                                successMessage: `${item.product_name} marked not available.`,
                              })
                            }
                            className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-red-50 px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-red-600 transition active:scale-95 disabled:opacity-50 hover:bg-red-100"
                          >
                            <i className="fa-solid fa-xmark text-[10px]" aria-hidden="true" />
                            <span>
                              {updatingItemAction === `${item.id}:available` ? "Updating..." : "Unavailable"}
                            </span>
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(updatingItemAction)}
                            onClick={() =>
                              handleItemUpdate({
                                action: "ready",
                                item,
                                payload: { is_ready: true },
                                successMessage: `${item.product_name} marked ready.`,
                              })
                            }
                            className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 transition active:scale-95 disabled:opacity-50 hover:bg-emerald-100"
                          >
                            <i className="fa-solid fa-check text-[10px]" aria-hidden="true" />
                            <span>
                              {updatingItemAction === `${item.id}:ready` ? "Updating..." : "Mark Ready"}
                            </span>
                          </button>
                        </>
                      ) : (
                        <div className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-gray-500 ring-1 ring-gray-200">
                          Pending
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Details */}
            <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h3 className="mb-4 text-[14px] font-extrabold text-gray-900">Bill Details</h3>
              <div className="space-y-3.5">
                <BillLine label="Item total" value={formatPrice(order.subtotal)} />
                <BillLine
                  label="Delivery fee"
                  action={
                    canEditOrder && order.delivery_fee > 0 ? (
                      <button
                        type="button"
                        disabled={removingDeliveryCharge}
                        onClick={handleRemoveDeliveryCharge}
                        className="inline-flex h-7 shrink-0 items-center justify-center rounded-lg bg-red-50 px-2.5 text-[9px] font-extrabold uppercase tracking-wider text-red-600 transition active:scale-95 disabled:opacity-50"
                      >
                        {removingDeliveryCharge ? "Removing..." : "Remove"}
                      </button>
                    ) : null
                  }
                  value={
                    order.delivery_fee > 0 ? (
                      formatPrice(order.delivery_fee)
                    ) : (
                      <span className="text-blue-600">Free</span>
                    )
                  }
                />
                {order.discount_amount > 0 && (
                  <BillLine
                    isDiscount
                    label="Discount"
                    value={`-${formatPrice(visibleDiscountAmount)}`}
                  />
                )}
                {order.not_available_amount > 0 && (
                  <BillLine
                    isDiscount
                    label="Not available"
                    value={`-${formatPrice(order.not_available_amount)}`}
                  />
                )}
                {canEditOrder && (
                  discountOpen ? (
                    <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50/50 p-3">
                      <label className="block">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          Add Discount (in Rs)
                        </span>
                        <input
                          autoFocus
                          min="0"
                          inputMode="numeric"
                          type="number"
                          value={discountAmount}
                          onChange={(event) => setDiscountAmount(event.target.value)}
                          placeholder="Enter amount"
                          className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[14px] font-bold text-gray-900 shadow-sm outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={updating || parseAmount(discountAmount) <= 0}
                        onClick={handleSaveDiscount}
                        className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
                      >
                        {updating ? "Saving..." : "Save Change"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDiscountOpen(true)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-primary transition active:scale-95 hover:bg-primary/20"
                    >
                      <i className="fa-solid fa-tag text-[10px]" aria-hidden="true" />
                      {order.discount_amount > 0 ? "Change Discount" : "Give Discount"}
                    </button>
                  )
                )}
                <div className="border-t border-dashed border-gray-200 pt-3.5">
                  <BillLine
                    label="Grand Total"
                    value={formatPrice(visibleTotalAmount)}
                    strong
                  />
                </div>
              </div>
            </div>

            {/* Notes & Alerts */}
            {order.customer_note && (
              <div className="flex items-start gap-3 rounded-[16px] border border-blue-100/50 bg-blue-50/80 p-4">
                <i className="fa-solid fa-note-sticky mt-0.5 text-[15px] text-blue-500" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Customer Note</p>
                  <p className="mt-0.5 text-[13px] font-semibold leading-relaxed text-blue-900">
                    {order.customer_note}
                  </p>
                </div>
              </div>
            )}

            {order.cancellation_reason && (
              <div className="flex items-start gap-3 rounded-[16px] border border-red-100/50 bg-red-50/80 p-4">
                <i className="fa-solid fa-circle-exclamation mt-0.5 text-[15px] text-red-500" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Reason</p>
                  <p className="mt-0.5 text-[13px] font-semibold leading-relaxed text-red-900">
                    {order.cancellation_reason}
                  </p>
                </div>
              </div>
            )}

          </div>
        )}
      </section>

      {/* Fixed Bottom Action Bar */}
      {showActionBottomBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[640px] border-t border-gray-100 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          {order?.status === "placed" ? (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={updating}
                onClick={handleMarkReady}
                className="flex h-12 items-center justify-center rounded-xl bg-emerald-600 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                {updating ? "..." : "Ready"}
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => setCompleteOpen(true)}
                className="flex h-12 items-center justify-center rounded-xl bg-primary text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                Complete
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => setRejectOpen(true)}
                className="flex h-12 items-center justify-center rounded-xl bg-red-50 text-[11px] font-bold uppercase tracking-wider text-red-600 transition active:scale-[0.98] disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          ) : order?.status === "ready" ? (
            <button
              type="button"
              disabled={updating}
              onClick={() => setCompleteOpen(true)}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-[12px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              Complete
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={updating}
                onClick={handleMarkReady}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-[12px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                {updating ? "Updating..." : "Mark Order as Ready"}
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() => setRejectOpen(true)}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-red-50 text-[12px] font-bold uppercase tracking-wider text-red-600 transition active:scale-[0.98] disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}

      <BottomSheetModal
        open={rejectOpen}
        onClose={() => {
          if (!updating) setRejectOpen(false);
        }}
        title="Cancellation Reason"
        className="max-w-[640px]"
      >
        <div className="space-y-4 px-4 pb-6 pt-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Order #{order?.order_number}
            </p>
            <h2 className="mt-1 text-xl font-black text-gray-900">
              Reject Order
            </h2>
          </div>

          <div>
            <label
              htmlFor="cancellation-reason"
              className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500"
            >
              Cancellation Reason *
            </label>
            <textarea
              id="cancellation-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="e.g. Item is out of stock."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] font-semibold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={updating}
              onClick={() => setRejectOpen(false)}
              className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-[13px] font-bold uppercase tracking-wider text-gray-700 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={handleReject}
              className="flex h-12 items-center justify-center rounded-xl bg-red-500 text-[13px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              {updating ? "Updating..." : "Reject"}
            </button>
          </div>
        </div>
      </BottomSheetModal>

      <BottomSheetModal
        open={completeOpen}
        onClose={() => {
          if (!updating) setCompleteOpen(false);
        }}
        title="Complete order"
        className="max-w-[640px]"
      >
        <div className="space-y-4 px-4 pb-6 pt-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Order #{order?.order_number}
            </p>
            <h2 className="mt-1 text-xl font-black text-gray-900">
              Select payment type
            </h2>
          </div>

          <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
            {(["cash", "online"] as const).map((type) => (
              <button
                key={type}
                type="button"
                disabled={updating}
                onClick={() => setPaymentType(type)}
                className={`h-11 rounded-lg text-[12px] font-extrabold uppercase tracking-wider transition ${
                  paymentType === type
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={updating}
              onClick={() => setCompleteOpen(false)}
              className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-[13px] font-bold uppercase tracking-wider text-gray-700 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={handleComplete}
              className="flex h-12 items-center justify-center rounded-xl bg-primary text-[13px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              {updating ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </BottomSheetModal>
    </main>
  );
}

function BillLine({
  action,
  isDiscount = false,
  label,
  strong = false,
  value,
}: {
  action?: ReactNode;
  isDiscount?: boolean;
  label: string;
  strong?: boolean;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "text-[13px] font-extrabold text-gray-900" : "text-[11px] font-bold uppercase tracking-wider text-gray-500"}>
        {label}
      </span>
      <div className="flex shrink-0 items-center gap-2.5">
        {action}
        <span
          className={`
            ${strong ? "text-[16px] font-black text-gray-900" : "text-[13px] font-bold"}
            ${isDiscount ? "text-blue-600" : (!strong && "text-gray-900")}
          `}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function getFulfillmentColor(type: OrderFulfillmentType) {
  if (type === "pickup") return "bg-purple-50 text-purple-600 ring-1 ring-purple-500/20";
  if (type === "express_delivery") return "bg-orange-50 text-orange-600 ring-1 ring-orange-500/20";
  return "bg-blue-50 text-blue-600 ring-1 ring-blue-500/20";
}

function getStatusColor(status: OrderStatus) {
  if (status === "placed") return "bg-blue-50 text-blue-600 ring-1 ring-blue-500/20";
  if (status === "accepted") return "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20";
  if (status === "preparing") return "bg-amber-50 text-amber-600 ring-1 ring-amber-500/20";
  if (status === "ready") return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20";
  if (status === "completed") return "bg-gray-100 text-gray-600 ring-1 ring-gray-300";
  if (status === "cancelled" || status === "rejected") return "bg-red-50 text-red-600 ring-1 ring-red-500/20";
  return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
}

function formatStatus(status: OrderStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatFulfillmentType(value: OrderFulfillmentType) {
  if (value === "pickup") return "Pickup";
  if (value === "express_delivery") return "Express";
  return "Scheduled";
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(price);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeStyle: "short",
  }).format(new Date(value));
}

function getDialablePhone(value: string) {
  return value.replace(/\D/g, "");
}

function getOrderDeliveryAddress(order: Order) {
  if (order.fullfillment_type === "pickup") return null;

  return order.address ?? order.delivery_address ?? order.shipping_address ?? null;
}

function canWriteOrder(order: Order | null) {
  if (!order) return false;
  return order.status !== "completed" && order.status !== "cancelled" && order.status !== "rejected";
}

function parseAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}
