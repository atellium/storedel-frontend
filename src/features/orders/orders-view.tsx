"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { BottomSheetModal } from "@/components/modals";
import { AuthGuard } from "@/features/auth/auth-guard";
import { getStoreSettings } from "@/features/stores/stores-service";
import type { StoreSettings } from "@/features/stores/types";
import {
  cancelOrder,
  getOrders,
  updateOrder,
  type Order,
  type OrderFulfillmentType,
} from "./orders-service";

export function OrdersView({ storeSlug }: { storeSlug: string }) {
  return (
    <AuthGuard>
      <OrdersContent storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function OrdersContent({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const storeName = orders[0]?.store.name ?? "Your store";

  useEffect(() => {
    let isMounted = true;

    Promise.all([getOrders(storeSlug), getStoreSettings(storeSlug)])
      .then(([nextOrders, nextSettings]) => {
        if (!isMounted) return;
        setOrders(nextOrders);
        setSettings(nextSettings);
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [storeSlug]);

  const handleOrderUpdate = (updatedOrder: Order) => {
    setOrders((current) =>
      current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
    );
    setSelectedOrder((current) =>
      current?.id === updatedOrder.id ? updatedOrder : current,
    );
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex h-10 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${storeSlug}`)}
            aria-label="Back to home"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-base" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 text-left">
            <h1 className="truncate text-base font-bold leading-tight text-gray-900">
              Orders
            </h1>
            <p className="mt-0.5 truncate text-[11px] font-medium text-gray-500">
              {storeName}
            </p>
          </div>
        </div>
      </header>

      <section className="px-3 py-4">
        {status === "loading" && (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-6 text-center text-sm font-medium text-gray-500 shadow-sm">
            Loading orders...
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-6 text-center text-sm font-medium text-red-500 shadow-sm">
            Could not load orders.
          </div>
        )}

        {status === "idle" && orders.length === 0 && (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-gray-100 bg-white px-6 py-10 text-center shadow-sm">
            <div className="flex size-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
              <i className="fa-solid fa-receipt text-2xl" aria-hidden="true" />
            </div>
            <p className="mt-4 text-sm font-bold text-gray-900">
              No orders yet
            </p>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Orders from this store will appear here.
            </p>
          </div>
        )}

        {status === "idle" && orders.length > 0 && (
          <div className="space-y-3 pb-8">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                onOrderUpdate={handleOrderUpdate}
                order={order}
                settings={settings}
                storeSlug={storeSlug}
                onViewDetails={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        )}
      </section>

      <BottomSheetModal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title="Order details"
        className="max-w-[640px]"
      >
        {selectedOrder && (
          <OrderDetailsSheet
            onOrderCancel={(order) => {
              handleOrderUpdate(order);
              setSelectedOrder(null);
              router.replace(`/${storeSlug}/orders`);
            }}
            order={selectedOrder}
          />
        )}
      </BottomSheetModal>
    </main>
  );
}

function OrderCard({
  onOrderUpdate,
  onViewDetails,
  order,
  settings,
  storeSlug,
}: {
  onOrderUpdate: (order: Order) => void;
  onViewDetails: () => void;
  order: Order;
  settings: StoreSettings | null;
  storeSlug: string;
}) {
  const router = useRouter();
  const [isTypeSheetOpen, setIsTypeSheetOpen] = useState(false);
  const [updatingType, setUpdatingType] = useState<OrderFulfillmentType | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canUpdateFulfillment = order.status === "placed" || order.status === "ready";
  const fulfillmentOptions = getFulfillmentUpdateOptions(order, settings);

  const handleFulfillmentUpdate = async (type: OrderFulfillmentType) => {
    if (updatingType) return;

    const deliveryFee = getDeliveryFeeForOrder(order, settings, type);
    setUpdatingType(type);
    setMessage(null);

    try {
      const updatedOrder = await updateOrder(order.order_number, {
        customer_note: order.customer_note,
        delivery_fee: deliveryFee,
        fullfillment_type: type,
        status: order.status,
      });
      onOrderUpdate(updatedOrder);
      setMessage(`Updated to ${formatFulfillmentType(type)}.`);
      setIsTypeSheetOpen(false);
    } catch {
      setMessage("Could not update order type.");
    } finally {
      setUpdatingType(null);
    }
  };

  return (
    <article className="overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">
            Order #{order.order_number}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] font-medium text-gray-500">
            <span>{formatDate(order.created_at)}</span>
            <span>•</span>
            <span>{formatTime(order.created_at)}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusClassName(order.status)}`}>
          {formatStatus(order.status)}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <p className="text-lg font-bold text-gray-900">
          {formatPrice(order.total_amount)}
        </p>
        <button
          type="button"
          onClick={onViewDetails}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-[11px] font-bold uppercase tracking-wider text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
        >
          View details
        </button>
      </div>

      {canUpdateFulfillment && (
        <div className="mt-4 border-t border-gray-100 pt-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Order type
              </p>
              <p className="mt-0.5 text-xs font-bold text-gray-900">
                {formatFulfillmentType(order.fullfillment_type)}
              </p>
            </div>
          </div>
          <div className={`mt-3 grid gap-2 ${fulfillmentOptions.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
            {fulfillmentOptions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessage(null);
                  setIsTypeSheetOpen(true);
                }}
                className="flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.98]"
              >
                Change Type
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push(`/${storeSlug}`)}
              className="flex h-10 items-center justify-center rounded-xl bg-primary px-3 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98]"
            >
              Add Items
            </button>
          </div>
          {message && (
            <p className="mt-3 text-[11px] font-semibold text-emerald-600">
              <i className="fa-solid fa-check-circle mr-1" /> {message}
            </p>
          )}
        </div>
      )}

      <BottomSheetModal
        open={isTypeSheetOpen}
        onClose={() => {
          if (!updatingType) setIsTypeSheetOpen(false);
        }}
        title="Change order type"
        className="max-w-[640px]"
        closeOnBackdropClick={!updatingType}
      >
        <div className="px-4 pb-6 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Current order type
          </p>
          <p className="mt-0.5 text-sm font-bold text-gray-900">
            {formatFulfillmentType(order.fullfillment_type)}
          </p>

          <div className="mt-5 space-y-2.5">
            {fulfillmentOptions.map((option) => {
              const deliveryFee = getDeliveryFeeForOrder(
                order,
                settings,
                option.type,
              );
              const feeDelta = getFulfillmentFeeDelta(order, deliveryFee, option.type);

              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => handleFulfillmentUpdate(option.type)}
                  disabled={Boolean(updatingType)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm transition active:bg-gray-50 disabled:opacity-70"
                >
                  <span className="text-sm font-bold text-gray-900">
                    {option.label}
                  </span>
                  <span className={`shrink-0 rounded bg-gray-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${feeDelta < 0 ? "text-emerald-600 ring-1 ring-emerald-500/20" : "text-gray-600 ring-1 ring-gray-200"}`}>
                    {updatingType === option.type ? "Updating..." : formatFeeDelta(feeDelta)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheetModal>
    </article>
  );
}

function OrderDetailsSheet({
  onOrderCancel,
  order,
}: {
  onOrderCancel: (order: Order) => void;
  order: Order;
}) {
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const canCancelOrder = order.status === "placed" || order.status === "accepted";
  const hasCancellationReason = cancellationReason.trim().length > 0;
  const deliveryAddress = getOrderDeliveryAddress(order);

  const handleCancelOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const reason = cancellationReason.trim();
    if (!reason) {
      setCancelError("Cancellation reason is required.");
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      const updatedOrder = await cancelOrder(order.order_number, reason);
      setCancellationReason("");
      setIsCancelSheetOpen(false);
      onOrderCancel(updatedOrder);
    } catch {
      setCancelError("Could not cancel this order. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            #{order.order_number}
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-gray-900">
            Order details
          </h2>
          <p className="mt-1 text-[11px] font-medium text-gray-500">
            {formatDate(order.created_at)} at {formatTime(order.created_at)}
          </p>
        </div>
        <span className={`shrink-0 rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusClassName(order.status)}`}>
          {formatStatus(order.status)}
        </span>
      </div>

      <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/50 p-1">
        <div className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 p-3"
            >
              <div className="min-w-0">
                <p className="line-clamp-2 text-xs font-semibold text-gray-800">
                  {item.product_name}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                  {item.variant_name} <span className="mx-0.5 text-gray-300">×</span> {item.quantity}
                </p>
                <p className="mt-1 text-[11px] font-medium text-gray-400">
                  {formatPrice(item.unit_price)} each
                </p>
              </div>
              <p className="shrink-0 text-xs font-bold text-gray-900">
                {formatPrice(item.line_total)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900">Bill details</h3>
        <div className="mt-3 space-y-2.5">
          <BillRow label="Item total" value={formatPrice(order.subtotal)} />
          <BillRow
            label="Delivery fee"
            value={order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : <span className="text-primary">Free</span>}
          />
          {order.discount_amount > 0 && (
            <BillRow
              label="Discount"
              value={`-${formatPrice(order.discount_amount)}`}
              isDiscount
            />
          )}
          {order.not_available_amount > 0 && (
            <BillRow
              label="Not available"
              value={`-${formatPrice(order.not_available_amount)}`}
              isDiscount
            />
          )}
          <div className="border-t border-dashed border-gray-200 pt-3">
            <BillRow
              label="Total amount"
              value={formatPrice(order.total_amount)}
              strong
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Order type
        </p>
        <p className="mt-0.5 text-sm font-bold text-gray-900">
          {formatFulfillmentType(order.fullfillment_type)}
        </p>
      </div>

      {deliveryAddress && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Delivery address
          </p>
          <p className="mt-2 text-sm font-bold text-gray-900">
            {deliveryAddress.recipient_name}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-gray-500">
            {deliveryAddress.phone}
          </p>
          <p className="mt-2 line-clamp-3 text-xs font-medium leading-5 text-gray-600">
            {deliveryAddress.full_address}
          </p>
        </div>
      )}

      {order.customer_note && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Note</p>
          <p className="mt-1 text-xs font-semibold text-gray-800">
            {order.customer_note}
          </p>
        </div>
      )}

      {canCancelOrder && (
        <button
          type="button"
          onClick={() => {
            setCancelError(null);
            setIsCancelSheetOpen(true);
          }}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-red-50 px-4 text-xs font-bold uppercase tracking-wider text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
        >
          Cancel order
        </button>
      )}

      <BottomSheetModal
        open={isCancelSheetOpen}
        onClose={() => {
          if (!isCancelling) setIsCancelSheetOpen(false);
        }}
        title="Cancel order"
        className="max-w-[640px]"
        closeOnBackdropClick={!isCancelling}
      >
        <form onSubmit={handleCancelOrder} className="px-4 pb-6 pt-3 text-left">
          <p className="text-xs font-medium leading-relaxed text-gray-500">
            Tell us why you want to cancel <strong className="text-gray-700">Order #{order.order_number}</strong>.
          </p>

          <label
            htmlFor={`cancellation_reason_${order.id}`}
            className="mt-5 block text-sm font-bold text-gray-900"
          >
            Cancellation reason
          </label>
          <textarea
            id={`cancellation_reason_${order.id}`}
            value={cancellationReason}
            onChange={(event) => {
              setCancellationReason(event.target.value);
              setCancelError(null);
            }}
            required
            rows={3}
            placeholder="e.g. I ordered by mistake"
            className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
          />
          {cancelError && (
            <p className="mt-2 text-[11px] font-semibold text-red-500">
              {cancelError}
            </p>
          )}

          {hasCancellationReason && (
            <button
              type="submit"
              disabled={isCancelling}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-red-500 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70"
            >
              {isCancelling ? "Cancelling..." : "Submit cancellation"}
            </button>
          )}
        </form>
      </BottomSheetModal>
    </div>
  );
}

function BillRow({
  label,
  strong = false,
  value,
  isDiscount = false,
}: {
  label: string;
  strong?: boolean;
  value: React.ReactNode;
  isDiscount?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "text-sm font-bold text-gray-900" : "text-xs font-medium text-gray-500"}>
        {label}
      </span>
      <span
        className={`
          ${strong ? "text-sm font-bold text-gray-900" : "text-xs font-semibold text-gray-900"}
          ${isDiscount ? "text-blue-600" : ""}
        `}
      >
        {value}
      </span>
    </div>
  );
}

function formatFulfillmentType(value: Order["fullfillment_type"]) {
  if (value === "pickup") return "Pickup";
  if (value === "express_delivery") return "Express delivery";
  return "Scheduled delivery";
}

function getOrderDeliveryAddress(order: Order) {
  if (order.fullfillment_type === "pickup") return null;

  return order.address ?? order.delivery_address ?? order.shipping_address ?? null;
}

function getFulfillmentUpdateOptions(
  order: Order,
  settings: StoreSettings | null,
) {
  if (!settings) return [];

  const options: Array<{ label: string; type: OrderFulfillmentType }> = [];

  if (
    order.fullfillment_type !== "pickup" &&
    settings.is_pickup_enabled
  ) {
    options.push({ label: "Pickup", type: "pickup" });
  }

  if (
    order.fullfillment_type !== "scheduled_delivery" &&
    settings.is_scheduled_delivery_enabled
  ) {
    options.push({
      label: "Scheduled delivery",
      type: "scheduled_delivery",
    });
  }

  if (
    order.fullfillment_type !== "express_delivery" &&
    settings.is_express_delivery_enabled
  ) {
    options.push({ label: "Express delivery", type: "express_delivery" });
  }

  return options;
}

function getDeliveryFeeForOrder(
  order: Order,
  settings: StoreSettings | null,
  type: OrderFulfillmentType,
) {
  if (!settings || type === "pickup") return 0;

  if (type === "express_delivery") {
    return order.subtotal < settings.express_min_order_amount
      ? settings.express_delivery_charge
      : 0;
  }

  return order.subtotal < settings.scheduled_min_order_amount
    ? settings.scheduled_delivery_charge
    : 0;
}

function getFulfillmentFeeDelta(
  order: Order,
  nextDeliveryFee: number,
  type: OrderFulfillmentType,
) {
  if (type === "pickup") return -order.delivery_fee;
  return nextDeliveryFee;
}

function formatFeeDelta(value: number) {
  if (value < 0) return `-${formatPrice(Math.abs(value))}`;
  if (value > 0) return `+${formatPrice(value)}`;
  return "Free";
}

function formatStatus(status: Order["status"]) {
  return status.replace(/_/g, " ");
}

function getStatusClassName(status: Order["status"]) {
  if (status === "placed") return "bg-blue-50 text-blue-600 ring-1 ring-blue-500/20";
  if (status === "accepted") return "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20";
  if (status === "preparing") return "bg-amber-50 text-amber-600 ring-1 ring-amber-500/20";
  if (status === "ready") return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20";
  if (status === "completed") return "bg-green-50 text-green-600 ring-1 ring-green-500/20";
  if (status === "cancelled") return "bg-gray-50 text-gray-500 ring-1 ring-gray-200";
  return "bg-red-50 text-red-600 ring-1 ring-red-500/20";
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
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
