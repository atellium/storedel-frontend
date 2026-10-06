"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BottomSheetModal } from "@/components/modals";
import { AuthGuard } from "@/features/auth/auth-guard";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/ui-slice";
import {
  getStoreOrders,
  updateStoreOrderStatus,
  type Order,
  type OrderFulfillmentType,
  type OrderStatus,
  type OrdersResponse,
} from "./orders-service";

const statusFilters: Array<OrderStatus | "all"> = [
  "all",
  "placed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
  "rejected",
];

const fulfillmentFilters: Array<OrderFulfillmentType | "all"> = [
  "all",
  "scheduled_delivery",
  "express_delivery",
  "pickup",
];

export function StoreOrdersView({ storeSlug }: { storeSlug: string }) {
  return (
    <AuthGuard>
      <StoreOrdersContent storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function StoreOrdersContent({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<
    OrderFulfillmentType | "all"
  >("all");
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [rejectionDraft, setRejectionDraft] = useState<{
    order: Order;
    reason: string;
    status: Extract<OrderStatus, "cancelled" | "rejected">;
  } | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getStoreOrders({
      fullfillmentType: fulfillmentFilter,
      page,
      pageSize: 20,
      status: filter,
      storeSlug,
    })
      .then((nextData) => {
        if (!isMounted) return;
        setData(nextData);
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [filter, fulfillmentFilter, page, storeSlug]);

  const orders = useMemo(() => data?.results ?? [], [data]);
  const pagination = data?.pagination;

  const handleRejectSubmit = async () => {
    if (!rejectionDraft || updatingOrderId) return;

    const cancellationReason = rejectionDraft.reason.trim();
    if (!cancellationReason) {
      dispatch(
        showToast({
          title: "Reason required",
          message: "Add a cancellation reason before continuing.",
          type: "error",
        }),
      );
      return;
    }

    setUpdatingOrderId(rejectionDraft.order.id);

    try {
      const updatedOrder = await updateStoreOrderStatus({
        cancellationReason,
        orderId: rejectionDraft.order.id,
        status: rejectionDraft.status,
        storeSlug,
      });

      setData((current) =>
        current
          ? {
            ...current,
            results: current.results.map((item) =>
              item.id === updatedOrder.id ? updatedOrder : item,
            ),
          }
          : current,
      );
      dispatch(
        showToast({
          title: "Order updated",
          message: `Order ${updatedOrder.order_number} marked ${formatStatus(rejectionDraft.status)}.`,
          type: "success",
        }),
      );
      setRejectionDraft(null);
    } catch {
      dispatch(
        showToast({
          title: "Could not update order",
          message: "Please check your connection and try again.",
          type: "error",
        }),
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900 pb-20">
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
          <h1 className="text-base font-bold text-gray-900">Orders</h1>
          <Link
            href={`/${storeSlug}/manage/dashboard`}
            aria-label="Dashboard"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-primary shadow-sm transition active:scale-95"
          >
            <i className="fa-solid fa-chart-line text-sm" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[20px] font-black tracking-tight text-gray-900">
            Order Management
          </h2>
          <span className="flex h-6 items-center justify-center rounded-full bg-gray-200/60 px-2.5 text-[11px] font-extrabold text-gray-600">
            {pagination?.total_items ?? orders.length}
          </span>
        </div>

        {/* Compact Filters */}
        <div className="mb-5 grid grid-cols-2 gap-2.5">
          <div className="relative">
            <select
              value={filter}
              onChange={(event) => {
                setStatus("loading");
                setPage(1);
                setFilter(event.target.value as OrderStatus | "all");
              }}
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-[12px] font-bold text-gray-900 shadow-sm outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            >
              <option value="all" disabled className="hidden">Status: All</option>
              {statusFilters.map((nextFilter) => (
                <option key={nextFilter} value={nextFilter}>
                  {nextFilter === "all" ? "All Statuses" : formatStatus(nextFilter)}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={fulfillmentFilter}
              onChange={(event) => {
                setStatus("loading");
                setPage(1);
                setFulfillmentFilter(
                  event.target.value as OrderFulfillmentType | "all",
                );
              }}
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-[12px] font-bold text-gray-900 shadow-sm outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            >
              <option value="all" disabled className="hidden">Type: All</option>
              {fulfillmentFilters.map((nextFilter) => (
                <option key={nextFilter} value={nextFilter}>
                  {formatFulfillmentType(nextFilter)}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none" />
          </div>
        </div>

        {status === "loading" && (
          <div className="rounded-[20px] border border-gray-100 bg-white px-4 py-8 text-center text-sm font-medium text-gray-500 shadow-sm">
            Loading orders...
          </div>
        )}

        {status === "error" && (
          <div className="rounded-[20px] border border-red-100 bg-red-50 px-4 py-8 text-center text-sm font-bold text-red-500 shadow-sm">
            Could not load orders.
          </div>
        )}

        {status === "idle" && orders.length === 0 && (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[20px] border border-gray-100 bg-white px-6 py-10 text-center shadow-sm">
            <div className="flex size-14 items-center justify-center rounded-full bg-gray-50 text-gray-300">
              <i className="fa-solid fa-receipt text-xl" aria-hidden="true" />
            </div>
            <p className="mt-4 text-[15px] font-extrabold text-gray-900">
              No orders found
            </p>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Adjust your filters or wait for new orders.
            </p>
          </div>
        )}

        {status === "idle" && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <StoreOrderOverviewCard
                key={order.id}
                order={order}
                storeSlug={storeSlug}
              />
            ))}
          </div>
        )}

        {/* Premium Pagination */}
        {status === "idle" && pagination && pagination.total_pages > 1 && (
          <div className="mt-6 flex items-center justify-between rounded-[20px] border border-gray-100 bg-white p-3 shadow-sm">
            <button
              type="button"
              disabled={!pagination.has_previous}
              onClick={() => {
                setStatus("loading");
                setPage(pagination.previous_page ?? page - 1);
              }}
              className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-700 transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              <i className="fa-solid fa-chevron-left mr-2 text-[10px]" /> Prev
            </button>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Page <span className="text-gray-900">{pagination.page}</span> of {pagination.total_pages}
            </span>
            <button
              type="button"
              disabled={!pagination.has_next}
              onClick={() => {
                setStatus("loading");
                setPage(pagination.next_page ?? page + 1);
              }}
              className="inline-flex h-10 min-w-[96px] items-center justify-center rounded-xl bg-primary px-4 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              Next <i className="fa-solid fa-chevron-right ml-2 text-[10px]" />
            </button>
          </div>
        )}
      </section>

      <BottomSheetModal
        open={Boolean(rejectionDraft)}
        onClose={() => {
          if (!updatingOrderId) setRejectionDraft(null);
        }}
        title="Cancellation Reason"
        className="max-w-[640px]"
      >
        {rejectionDraft && (
          <div className="space-y-4 px-4 pb-6 pt-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Order #{rejectionDraft.order.order_number}
              </p>
              <h2 className="mt-1 text-xl font-black text-gray-900">
                {formatAction(rejectionDraft.status)} Order
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
                value={rejectionDraft.reason}
                onChange={(event) =>
                  setRejectionDraft((current) =>
                    current ? { ...current, reason: event.target.value } : current,
                  )
                }
                rows={4}
                placeholder="e.g. Item is out of stock."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] font-semibold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={Boolean(updatingOrderId)}
                onClick={() => setRejectionDraft(null)}
                className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-[13px] font-bold uppercase tracking-wider text-gray-700 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(updatingOrderId)}
                onClick={handleRejectSubmit}
                className="flex h-12 items-center justify-center rounded-xl bg-red-500 text-[13px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                {updatingOrderId ? "Updating..." : formatAction(rejectionDraft.status)}
              </button>
            </div>
          </div>
        )}
      </BottomSheetModal>
    </main>
  );
}

function StoreOrderOverviewCard({
  order,
  storeSlug,
}: {
  order: Order;
  storeSlug: string;
}) {
  return (
    <Link
      href={`/${storeSlug}/manage/orders/${order.order_number}`}
      className="group block overflow-hidden rounded-[20px] border border-gray-100 bg-white p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-black tracking-tight text-gray-900">
              #{order.order_number}
            </h3>
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider ${getFulfillmentColor(order.fullfillment_type)}`}>
              {formatFulfillmentType(order.fullfillment_type)}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-gray-500">
            {formatDate(order.created_at)} at {formatTime(order.created_at)}
          </p>
        </div>
        <p className="text-[16px] font-black text-gray-900">
          {formatPrice(order.total_amount)}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="flex min-w-0 items-center gap-2 pr-3">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400">
            <i className="fa-solid fa-user text-[9px]" aria-hidden="true" />
          </div>
          <span className="truncate text-[12px] font-bold text-gray-700">
            {order.customer?.full_name || "Guest"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
            {formatStatus(order.status)}
          </span>
          <div className="flex size-6 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            <i className="fa-solid fa-chevron-right text-[9px]" aria-hidden="true" />
          </div>
        </div>
      </div>
    </Link>
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

function formatStatus(status: OrderStatus | "all") {
  if (status === "all") return "All";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatFulfillmentType(value: OrderFulfillmentType | "all") {
  if (value === "all") return "All Types";
  if (value === "pickup") return "Pickup";
  if (value === "express_delivery") return "Express";
  return "Scheduled";
}

function formatAction(status: OrderStatus) {
  if (status === "accepted") return "Accept";
  if (status === "preparing") return "Start Prep";
  if (status === "ready") return "Mark Ready";
  if (status === "completed") return "Complete";
  if (status === "rejected") return "Reject";
  if (status === "cancelled") return "Cancel";
  return formatStatus(status);
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