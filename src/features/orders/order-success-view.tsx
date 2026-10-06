"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { BottomSheetModal } from "@/components/modals";
import { AuthGuard } from "@/features/auth/auth-guard";
import { cancelOrder, getOrders, type Order } from "./orders-service";

const SUCCESS_REDIRECT_DELAY_MS = 2 * 60 * 1000;

export function OrderSuccessView({
  orderNumber,
  storeSlug,
}: {
  orderNumber: string;
  storeSlug: string;
}) {
  return (
    <AuthGuard>
      <OrderSuccessContent orderNumber={orderNumber} storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function OrderSuccessContent({
  orderNumber,
  storeSlug,
}: {
  orderNumber: string;
  storeSlug: string;
}) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  useEffect(() => {
    const storageKey = getSuccessAccessStorageKey(storeSlug, orderNumber);
    const now = Date.now();
    const savedExpiresAt = Number(window.localStorage.getItem(storageKey));
    const expiresAt =
      Number.isFinite(savedExpiresAt) && savedExpiresAt > 0
        ? savedExpiresAt
        : now + SUCCESS_REDIRECT_DELAY_MS;

    if (expiresAt <= now) {
      router.replace(`/${storeSlug}/orders`);
      return;
    }

    if (!savedExpiresAt) {
      window.localStorage.setItem(storageKey, String(expiresAt));
    }

    const redirectTimer = window.setTimeout(() => {
      router.replace(`/${storeSlug}/orders`);
    }, expiresAt - now);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [orderNumber, router, storeSlug]);

  useEffect(() => {
    let isMounted = true;

    getOrders(storeSlug)
      .then((orders) => {
        if (!isMounted) return;
        const matchingOrder =
          orders.find((item) => item.order_number === orderNumber) ?? null;

        if (matchingOrder?.status === "cancelled") {
          router.replace(`/${storeSlug}/orders`);
          return;
        }

        setOrder(matchingOrder);
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [orderNumber, router, storeSlug]);

  const storeName = order?.store.name ?? "this store";
  const displayOrderNumber = order?.order_number ?? orderNumber;
  const canCancelOrder = order?.status === "placed" || order?.status === "accepted";
  const hasCancellationReason = cancellationReason.trim().length > 0;

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
      const updatedOrder = await cancelOrder(displayOrderNumber, reason);
      setOrder(updatedOrder);
      setIsCancelModalOpen(false);
      setCancellationReason("");
      router.replace(`/${storeSlug}/orders`);
    } catch {
      setCancelError("Could not cancel this order. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900">
      <header className="px-3 py-3">
        <button
          type="button"
          onClick={() => router.replace(`/${storeSlug}`)}
          aria-label="Back to home"
          className="inline-flex size-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition active:scale-95"
        >
          <i className="fa-solid fa-arrow-left text-sm" aria-hidden="true" />
        </button>
      </header>

      <section className="flex min-h-[calc(100dvh-64px)] flex-col px-4 pb-8 pt-0 text-center">
        {/* Ad Placeholder Space */}
        <div className="mb-5 flex min-h-[80px] w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Advertisement Space
        </div>

        <div className="flex flex-1 flex-col items-center">
          {/* Simple Product Icon with Checkmark */}
          <div className="relative flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.15)]">
            <i className="fa-solid fa-box text-3xl" aria-hidden="true" />
            <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-white">
              <i className="fa-solid fa-circle-check text-xl text-emerald-500" aria-hidden="true" />
            </div>
          </div>

          <h1 className="mt-4 text-lg font-extrabold leading-tight text-gray-900">
            Order Placed Successfully
          </h1>
          <p className="mt-1 text-xs font-medium text-gray-500">
            Thank you for shopping at <span className="font-semibold text-gray-700">{storeName}</span>
          </p>

          {status === "error" && (
            <p className="mt-2 text-[10px] font-semibold text-red-500">
              Could not load the order number right now.
            </p>
          )}

          {order && (
            <OrderSummary
              order={order}
              displayOrderNumber={status === "loading" ? "Loading..." : displayOrderNumber}
            />
          )}

          {/* Prominent Action Buttons */}
          <div className="mt-6 flex w-full flex-col gap-2.5">
            <button
              type="button"
              onClick={() => router.replace(`/${storeSlug}/orders`)}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98]"
            >
              View Order Details
            </button>

            {order && canCancelOrder && (
              <button
                type="button"
                onClick={() => {
                  setCancelError(null);
                  setIsCancelModalOpen(true);
                }}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-red-50 text-xs font-bold uppercase tracking-wider text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </section>

      <BottomSheetModal
        open={isCancelModalOpen}
        onClose={() => {
          if (!isCancelling) setIsCancelModalOpen(false);
        }}
        title="Cancel order"
        className="max-w-[640px]"
        closeOnBackdropClick={!isCancelling}
      >
        <form onSubmit={handleCancelOrder} className="px-4 pb-6 pt-3 text-left">
          <p className="text-xs font-medium leading-relaxed text-gray-500">
            Tell us why you want to cancel <strong className="text-gray-700">Order #{displayOrderNumber}</strong>.
          </p>

          <label
            htmlFor="cancellation_reason"
            className="mt-5 block text-sm font-bold text-gray-900"
          >
            Cancellation reason
          </label>
          <textarea
            id="cancellation_reason"
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
              className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-red-500 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70"
            >
              {isCancelling ? "Cancelling..." : "Submit Cancellation"}
            </button>
          )}
        </form>
      </BottomSheetModal>
    </main>
  );
}

function OrderSummary({ order, displayOrderNumber }: { order: Order; displayOrderNumber: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalItemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="mt-5 w-full overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-sm">
      <div className="flex items-center justify-between gap-3 bg-gray-50/50 px-4 py-3">
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-gray-900">Order Summary</h2>
          <span className="mt-0.5 text-[10px] font-medium text-gray-500">
            Order #{displayOrderNumber}
          </span>
        </div>
        <span className="rounded bg-gray-200/60 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-600">
          {formatFulfillmentType(order.fullfillment_type)}
        </span>
      </div>

      <div className="px-3 py-2.5">
        {/* Short View Toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between rounded-lg bg-gray-50 px-3 py-2 transition-colors active:bg-gray-100"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs font-bold text-gray-900">
              {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold text-gray-500">
              Total: {formatPrice(order.total_amount)}
            </span>
          </div>
          <div className="flex size-7 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
            <i
              className={`fa-solid fa-chevron-${isExpanded ? "up" : "down"} text-[10px] text-gray-500 transition-transform`}
              aria-hidden="true"
            />
          </div>
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200 px-1">
            <div className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold text-gray-800">
                      {item.product_name}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                      {item.variant_name} <span className="mx-0.5 text-gray-300">×</span> {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-bold text-gray-900">
                    {formatPrice(item.line_total)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-2 space-y-2 border-t border-dashed border-gray-200 pt-3">
              <SummaryRow label="Item total" value={formatPrice(order.subtotal)} />
              <SummaryRow
                label="Delivery fee"
                value={order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : <span className="text-primary">Free</span>}
              />
              {order.discount_amount > 0 && (
                <SummaryRow
                  label="Discount"
                  value={`-${formatPrice(order.discount_amount)}`}
                  isDiscount
                />
              )}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <SummaryRow
                  label="Grand Total"
                  value={formatPrice(order.total_amount)}
                  strong
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
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

function getSuccessAccessStorageKey(storeSlug: string, orderNumber: string) {
  return `storedel:order-success:${storeSlug}:${orderNumber}`;
}
