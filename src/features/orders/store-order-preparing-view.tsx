"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AuthGuard } from "@/features/auth/auth-guard";
import {
  getStoreOrder,
  updateStoreOrder,
  updateStoreOrderItem,
  type Order,
  type OrderItem,
  type UpdateStoreOrderItemPayload,
} from "./orders-service";

export function StoreOrderPreparingView({
  orderId,
  storeSlug,
}: {
  orderId: string;
  storeSlug: string;
}) {
  return (
    <AuthGuard>
      <StoreOrderPreparingContent orderId={orderId} storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function StoreOrderPreparingContent({
  orderId,
  storeSlug,
}: {
  orderId: string;
  storeSlug: string;
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [updatingItemAction, setUpdatingItemAction] = useState<string | null>(null);
  const [removingDeliveryCharge, setRemovingDeliveryCharge] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");

  useEffect(() => {
    let isMounted = true;

    getStoreOrder({ orderId, storeSlug })
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
  }, [orderId, storeSlug]);

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
    if (updatingItemAction) return;

    setUpdatingItemAction(actionId);
    setMessage(null);

    try {
      const updatedOrder = await updateStoreOrderItem({
        itemId: item.id,
        payload,
      });
      setOrder(updatedOrder);
      setMessage(successMessage);
    } catch {
      setMessage("Could not update item.");
    } finally {
      setUpdatingItemAction(null);
    }
  };

  const handleMarkReady = async () => {
    if (!order || markingReady) return;

    setMarkingReady(true);
    setMessage(null);

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
      router.push(`/${storeSlug}/manage/orders`);
    } catch {
      setMessage("Could not mark order ready.");
    } finally {
      setMarkingReady(false);
    }
  };

  const handleRemoveDeliveryCharge = async () => {
    if (!order || order.delivery_fee <= 0 || removingDeliveryCharge) return;

    setRemovingDeliveryCharge(true);
    setMessage(null);

    try {
      const payload = {
        ...(order.address_id ? { address_id: order.address_id } : {}),
        customer_note: order.customer_note,
        status: order.status,
        fullfillment_type: order.fullfillment_type,
        delivery_fee: 0,
      };

      const updatedOrder = await updateStoreOrder({
        orderNumber: order.order_number,
        payload,
        storeSlug,
      });
      setOrder(updatedOrder);
      setMessage("Delivery charge removed.");
    } catch {
      setMessage("Could not remove delivery charge.");
    } finally {
      setRemovingDeliveryCharge(false);
    }
  };

  const enteredDiscountAmount = parseAmount(discountAmount);
  const visibleDiscountAmount = enteredDiscountAmount > 0
    ? enteredDiscountAmount
    : order?.discount_amount ?? 0;
  const visibleTotalAmount = order
    ? Math.max(0, order.total_amount + order.discount_amount - visibleDiscountAmount)
    : 0;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] pb-28 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex h-10 items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition active:scale-95 hover:bg-gray-50"
          >
            <i className="fa-solid fa-arrow-left text-base" aria-hidden="true" />
          </button>
          <h1 className="text-base font-bold text-gray-900">
            {order ? `Prepare #${order.order_number}` : "Prepare Order"}
          </h1>
          <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-primary shadow-sm">
            <i className="fa-solid fa-list-check text-sm" aria-hidden="true" />
          </div>
        </div>
      </header>

      <section className="px-4 py-6">
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

        {message && (
          <div className={`mb-5 flex items-center gap-3 rounded-[16px] px-4 py-3 text-[13px] font-bold shadow-sm ${message.includes("Could not")
              ? "border border-red-100/50 bg-red-50/80 text-red-600"
              : "border border-emerald-100/50 bg-emerald-50/80 text-emerald-600"
            }`}>
            <i className={`fa-solid ${message.includes("Could not") ? "fa-circle-exclamation" : "fa-circle-check"}`} />
            {message}
          </div>
        )}

        {status === "idle" && order && (
          <>
            <div className="space-y-4">
              {/* Customer Details */}
              {order.customer && (
                <div className="flex items-center justify-between gap-3 rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-100">
                      <i className="fa-solid fa-user text-[13px]" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-extrabold text-gray-900">
                        {order.customer.full_name}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {order.customer.phone || "Customer"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Checklist Items */}
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
                    <div key={item.id} className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[13px] font-extrabold leading-snug text-gray-900">
                            {item.product_name}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-gray-500">
                              {item.variant_name} <span className="mx-1 text-gray-300">×</span> <span className="font-extrabold text-gray-900">{item.quantity}</span>
                            </p>
                            <p className="text-[12px] font-extrabold text-gray-900">
                              {formatPrice(item.line_total)}
                            </p>
                          </div>
                        </div>
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
                        ) : (
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
                  <BillRow label="Item total" value={formatPrice(order.subtotal)} />
                  <BillRow
                    label="Delivery charge"
                    value={formatPrice(order.delivery_fee)}
                    action={
                      order.delivery_fee > 0 ? (
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
                  />

                  {order.not_available_amount > 0 && (
                    <BillRow
                      label="Not available"
                      value={`-${formatPrice(order.not_available_amount)}`}
                      isDiscount
                    />
                  )}

                  {visibleDiscountAmount > 0 && (
                    <BillRow
                      label="Discount applied"
                      value={`-${formatPrice(visibleDiscountAmount)}`}
                      isDiscount
                    />
                  )}

                  {discountOpen ? (
                    <label className="block rounded-xl border border-gray-200 bg-gray-50/50 p-3 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Add Discount (₹)
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
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDiscountOpen(true)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-primary transition active:scale-95 hover:bg-primary/20"
                    >
                      <i className="fa-solid fa-tag text-[10px]" aria-hidden="true" />
                      Give Discount
                    </button>
                  )}

                  <div className="border-t border-dashed border-gray-200 pt-3.5">
                    <BillRow
                      label="Grand total"
                      value={formatPrice(visibleTotalAmount)}
                      strong
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[640px] border-t border-gray-100 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
              <button
                type="button"
                disabled={markingReady || order.status === "ready"}
                onClick={handleMarkReady}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-[13px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              >
                {markingReady ? "Updating..." : "Mark Order as Ready"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function BillRow({
  action,
  label,
  strong = false,
  value,
  isDiscount = false,
}: {
  action?: ReactNode;
  label: string;
  strong?: boolean;
  value: string;
  isDiscount?: boolean;
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

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(price);
}

function parseAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}