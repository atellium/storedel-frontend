"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type HTMLAttributes } from "react";
import { BottomSheetModal } from "@/components/modals";
import {
  createUserAddress,
  getCitiesByPincodePrefix,
  getUserAddresses,
  type UserAddress,
  type UserAddressCity,
  type UserAddressPayload,
} from "@/features/addresses/address-service";
import { AuthGuard } from "@/features/auth/auth-guard";
import { getStoreSettings } from "@/features/stores/stores-service";
import type { StoreSettings } from "@/features/stores/types";
import {
  cancelOrder,
  getOrders,
  updateOrder,
  type Order,
  type OrderFulfillmentType,
  type OrderStatus,
} from "./orders-service";

type AddressFormValues = {
  address_type: string;
  custom_label: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  landmark: string;
  city_id: string;
  postal_code: string;
  is_default: boolean;
};

const emptyAddressForm: AddressFormValues = {
  address_type: "home",
  custom_label: "",
  recipient_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  landmark: "",
  city_id: "",
  postal_code: "",
  is_default: false,
};

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
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const storeName = orders[0]?.store.name ?? "Your store";

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getOrders(storeSlug),
      getStoreSettings(storeSlug),
      getUserAddresses().catch(() => []),
    ])
      .then(([nextOrders, nextSettings, nextAddresses]) => {
        if (!isMounted) return;
        setOrders(nextOrders);
        setSettings(nextSettings);
        setAddresses(nextAddresses);
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
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900 pb-20">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex h-10 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${storeSlug}`)}
            aria-label="Back to home"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition active:scale-95 hover:bg-gray-50"
          >
            <i className="fa-solid fa-arrow-left text-base" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 text-left">
            <h1 className="truncate text-base font-black leading-tight text-gray-900">
              Orders
            </h1>
            <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-wider text-primary">
              {storeName}
            </p>
          </div>
        </div>
      </header>

      <section className="px-4 py-5">
        {status === "loading" && (
          <div className="rounded-[20px] border border-gray-100 bg-white px-4 py-8 text-center text-sm font-medium text-gray-500 shadow-sm">
            Loading your orders...
          </div>
        )}

        {status === "error" && (
          <div className="rounded-[20px] border border-red-100 bg-red-50 px-4 py-8 text-center text-sm font-bold text-red-500 shadow-sm">
            Could not load your orders.
          </div>
        )}

        {status === "idle" && orders.length === 0 && (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[20px] border border-gray-100 bg-white px-6 py-10 text-center shadow-sm">
            <div className="flex size-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
              <i className="fa-solid fa-receipt text-2xl" aria-hidden="true" />
            </div>
            <p className="mt-4 text-[15px] font-extrabold text-gray-900">
              No orders yet
            </p>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Orders from this store will appear here.
            </p>
          </div>
        )}

        {status === "idle" && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        )}
      </section>

      <BottomSheetModal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
        className="max-w-[640px]"
      >
        {selectedOrder && (
          <OrderDetailsSheet
            order={selectedOrder}
            settings={settings}
            storeSlug={storeSlug}
            addresses={addresses}
            onAddressCreate={(address) => setAddresses((current) => [address, ...current])}
            onOrderUpdate={handleOrderUpdate}
            onOrderCancel={(order) => {
              handleOrderUpdate(order);
            }}
          />
        )}
      </BottomSheetModal>
    </main>
  );
}

function OrderCard({
  order,
  onViewDetails,
}: {
  order: Order;
  onViewDetails: () => void;
}) {
  return (
    <div
      onClick={onViewDetails}
      role="button"
      tabIndex={0}
      className="group block cursor-pointer overflow-hidden rounded-[20px] border border-gray-100 bg-white p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
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
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
          {formatStatus(order.status)}
        </span>
        <div className="flex size-6 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
          <i className="fa-solid fa-chevron-right text-[9px]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function OrderDetailsSheet({
  addresses,
  onAddressCreate,
  onOrderCancel,
  onOrderUpdate,
  order,
  settings,
  storeSlug,
}: {
  addresses: UserAddress[];
  onAddressCreate: (address: UserAddress) => void;
  onOrderCancel: (order: Order) => void;
  onOrderUpdate: (order: Order) => void;
  order: Order;
  settings: StoreSettings | null;
  storeSlug: string;
}) {
  const router = useRouter();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fulfillment update state
  const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);
  const [pendingDeliveryType, setPendingDeliveryType] = useState<OrderFulfillmentType | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState(
    getOrderDeliveryAddress(order)?.id ?? getDefaultAddressId(addresses),
  );
  const [addressForm, setAddressForm] = useState<AddressFormValues>(emptyAddressForm);
  const [cityOptions, setCityOptions] = useState<UserAddressCity[]>([]);
  const [cityStatus, setCityStatus] = useState<"idle" | "loading" | "error">("idle");
  const [savingAddress, setSavingAddress] = useState(false);
  const [updatingType, setUpdatingType] = useState<OrderFulfillmentType | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canUpdateFulfillment = order.status === "placed" || order.status === "ready";
  const canCancelOrder = order.status === "placed" || order.status === "accepted";
  const hasCancellationReason = cancellationReason.trim().length > 0;
  const deliveryAddress = getOrderDeliveryAddress(order);
  const fulfillmentOptions = getFulfillmentUpdateOptions(order, settings);
  const activeAddresses = addresses.filter((address) => address.is_active);

  useEffect(() => {
    if (!isAddressSheetOpen || addressForm.postal_code.trim().length < 3) {
      return;
    }
    let isMounted = true;
    getCitiesByPincodePrefix(addressForm.postal_code.trim().slice(0, 3))
      .then((cities) => {
        if (!isMounted) return;
        setCityOptions(cities);
        setAddressForm((current) => ({
          ...current,
          city_id: cities.length === 1 ? String(cities[0].id) : current.city_id,
        }));
        setCityStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setCityOptions([]);
        setCityStatus("error");
      });
    return () => {
      isMounted = false;
    };
  }, [addressForm.postal_code, isAddressSheetOpen]);

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

  const handleFulfillmentUpdate = async (type: OrderFulfillmentType, addressId?: string) => {
    if (updatingType) return;
    const deliveryFee = getDeliveryFeeForOrder(order, settings, type);
    setUpdatingType(type);
    setMessage(null);
    try {
      const payload = {
        customer_note: order.customer_note,
        delivery_fee: deliveryFee,
        fullfillment_type: type,
        ...(type === "pickup" ? {} : { address_id: addressId }),
        status: order.status,
      };
      const updatedOrder = await updateOrder(order.order_number, payload);
      onOrderUpdate(updatedOrder);
      setMessage(`Updated to ${formatFulfillmentType(type)}.`);
      setPendingDeliveryType(null);
    } catch {
      setMessage("Could not update order type.");
    } finally {
      setUpdatingType(null);
    }
  };

  const handleTypeOptionClick = (type: OrderFulfillmentType) => {
    if (type !== "pickup") {
      setPendingDeliveryType(type);
      setSelectedAddressId(getOrderDeliveryAddress(order)?.id ?? getDefaultAddressId(addresses));
      return;
    }
    void handleFulfillmentUpdate(type);
  };

  const handleConfirmDeliveryAddress = () => {
    if (!pendingDeliveryType) return;
    if (!selectedAddressId) {
      setMessage("Select or add a delivery address.");
      return;
    }
    void handleFulfillmentUpdate(pendingDeliveryType, selectedAddressId);
  };

  const handleAddressSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!addressForm.city_id || savingAddress) return;
    setSavingAddress(true);
    setMessage(null);
    try {
      const savedAddress = await createUserAddress(getAddressPayload(addressForm));
      onAddressCreate(savedAddress);
      setSelectedAddressId(savedAddress.id);
      setAddressForm(emptyAddressForm);
      setCityOptions([]);
      setIsAddressSheetOpen(false);
    } catch {
      setMessage("Could not save address.");
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <div className="px-4 pb-6 pt-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            #{order.order_number}
          </p>
          <h2 className="mt-0.5 text-lg font-black text-gray-900">
            Order Details
          </h2>
          <p className="mt-1 text-[11px] font-semibold text-gray-500">
            {formatDate(order.created_at)} at {formatTime(order.created_at)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
          {formatStatus(order.status)}
        </span>
      </div>

      {message && (
        <div className="mt-4 flex items-center gap-3 rounded-[12px] bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-500/20">
          <i className="fa-solid fa-check-circle" />
          {message}
        </div>
      )}

      {/* Items List */}
      <div className="mt-5 overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Items Ordered
          </p>
        </div>
        <div className="divide-y divide-gray-50 px-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-900">
                  {item.product_name}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-gray-500">
                  {item.variant_name} <span className="mx-1 text-gray-300">×</span> {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-[13px] font-extrabold text-gray-900">
                {formatPrice(item.line_total)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bill Details */}
      <div className="mt-4 rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <h3 className="mb-4 text-[14px] font-extrabold text-gray-900">Bill Details</h3>
        <div className="space-y-3.5">
          <BillRow label="Item total" value={formatPrice(order.subtotal)} />
          {order.fullfillment_type !== "pickup" && (
            <BillRow
              label="Delivery fee"
              value={order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : <span className="text-blue-600">Free</span>}
            />
          )}
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
          <div className="border-t border-dashed border-gray-200 pt-3.5">
            <BillRow
              label="Total amount"
              value={formatPrice(order.total_amount)}
              strong
            />
          </div>
        </div>
      </div>

      {/* Fulfillment Info */}
      <div className="mt-4 rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Order Type
        </p>
        <p className="mt-1 text-[14px] font-black text-gray-900">
          {formatFulfillmentType(order.fullfillment_type)}
        </p>
        {canUpdateFulfillment && fulfillmentOptions.length > 0 && (
          <div className="mt-4 space-y-2.5 border-t border-gray-100 pt-4">
            {fulfillmentOptions.map((option) => {
              const deliveryFee = getDeliveryFeeForOrder(order, settings, option.type);

              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => handleTypeOptionClick(option.type)}
                  disabled={Boolean(updatingType)}
                  aria-pressed={pendingDeliveryType === option.type}
                  className={`flex h-11 w-full items-center justify-between gap-3 rounded-xl border px-3 text-left transition active:scale-[0.98] disabled:opacity-70 ${
                    pendingDeliveryType === option.type
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <span className="text-[12px] font-bold uppercase tracking-wider text-gray-800">
                    Change to {formatFulfillmentType(option.type)}
                  </span>
                  <span className="shrink-0 rounded bg-gray-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600 ring-1 ring-gray-200">
                    {deliveryFee > 0 ? `+${formatPrice(deliveryFee)}` : "Free"}
                  </span>
                </button>
              );
            })}

            {pendingDeliveryType && (
              <div className="rounded-[16px] border border-gray-100 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Delivery Address
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-gray-500">
                      Required for {formatFulfillmentType(pendingDeliveryType)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressForm(emptyAddressForm);
                      setCityOptions([]);
                      setCityStatus("idle");
                      setIsAddressSheetOpen(true);
                    }}
                    className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-primary transition active:scale-95"
                  >
                    Add
                  </button>
                </div>

                {activeAddresses.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {activeAddresses.map((address) => {
                      const active = selectedAddressId === address.id;
                      return (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => setSelectedAddressId(address.id)}
                          aria-pressed={active}
                          className={`flex w-full items-start gap-3 rounded-[14px] border p-3 text-left transition active:scale-[0.99] ${
                            active
                              ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                              : "border-gray-100 bg-gray-50/50"
                          }`}
                        >
                          <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-primary bg-primary" : "border-gray-300 bg-white"}`}>
                            {active && <span className="size-1.5 rounded-full bg-white shadow-sm" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-[13px] font-extrabold ${active ? "text-primary" : "text-gray-900"}`}>
                              {address.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-semibold text-gray-700">
                              {address.recipient_name} <span className="mx-1 text-gray-300">&bull;</span> {address.phone}
                            </span>
                            <span className="mt-1 block line-clamp-2 text-[10px] font-medium leading-snug text-gray-500">
                              {address.full_address}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 rounded-[14px] border border-dashed border-gray-200 bg-gray-50/50 px-3 py-5 text-center text-[11px] font-semibold text-gray-500">
                    Add an address before switching to delivery.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleConfirmDeliveryAddress}
                  disabled={Boolean(updatingType) || !selectedAddressId}
                  className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
                >
                  {updatingType === pendingDeliveryType ? "Updating..." : "Confirm Delivery"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delivery Address */}
      {deliveryAddress && (
        <div className="mt-4 rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Delivery Address
          </p>
          <p className="mt-2 text-[14px] font-extrabold text-gray-900">
            {deliveryAddress.recipient_name}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-gray-500">
            {deliveryAddress.phone}
          </p>
          <p className="mt-2 line-clamp-3 text-[11px] font-medium leading-snug text-gray-600">
            {deliveryAddress.full_address}
          </p>
        </div>
      )}

      {/* Note */}
      {order.customer_note && (
        <div className="mt-4 flex items-start gap-3 rounded-[16px] border border-blue-100/50 bg-blue-50/80 p-4">
          <i className="fa-solid fa-note-sticky mt-0.5 text-[15px] text-blue-500" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Note</p>
            <p className="mt-0.5 text-[13px] font-semibold leading-relaxed text-blue-900">
              {order.customer_note}
            </p>
          </div>
        </div>
      )}

      <div className={`mt-6 grid gap-2.5 ${canUpdateFulfillment && canCancelOrder ? "grid-cols-2" : "grid-cols-1"}`}>
        {canUpdateFulfillment && (
          <button
            type="button"
            onClick={() => router.push(`/${storeSlug}`)}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-primary px-3 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98]"
          >
            Add Items
          </button>
        )}

        {canCancelOrder && (
          <button
            type="button"
            onClick={() => {
              setCancelError(null);
              setIsCancelSheetOpen(true);
            }}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-red-50 px-4 text-[11px] font-bold uppercase tracking-wider text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
          >
            Cancel Order
          </button>
        )}
      </div>


      <BottomSheetModal
        open={isCancelSheetOpen}
        onClose={() => {
          if (!isCancelling) setIsCancelSheetOpen(false);
        }}
        title="Cancel Order"
        className="max-w-[640px]"
        closeOnBackdropClick={!isCancelling}
      >
        <form onSubmit={handleCancelOrder} className="px-4 pb-6 pt-3 text-left">
          <p className="text-[11px] font-medium leading-relaxed text-gray-500">
            Tell us why you want to cancel <strong className="text-gray-700">Order #{order.order_number}</strong>.
          </p>

          <label
            htmlFor={`cancellation_reason_${order.id}`}
            className="mt-5 mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500"
          >
            Cancellation Reason
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
            placeholder="e.g. I ordered by mistake."
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] font-semibold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
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
              className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-red-500 px-4 text-[12px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70"
            >
              {isCancelling ? "Cancelling..." : "Submit Cancellation"}
            </button>
          )}
        </form>
      </BottomSheetModal>

      {/* Reusable Address Addition nested sheet */}
      <BottomSheetModal
        open={isAddressSheetOpen}
        onClose={() => {
          if (!savingAddress) setIsAddressSheetOpen(false);
        }}
        title="Add Delivery Address"
        className="max-w-[640px]"
        closeOnBackdropClick={!savingAddress}
      >
        <form onSubmit={handleAddressSubmit} className="px-4 pb-6 pt-4">
          <div className="grid gap-3 rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <AddressField label="Address line 1" placeholder="House number, building, street" required value={addressForm.address_line1} onChange={(val) => setAddressForm(c => ({ ...c, address_line1: val }))} />
            <AddressField label="Address line 2" placeholder="Area, colony, apartment" value={addressForm.address_line2} onChange={(val) => setAddressForm(c => ({ ...c, address_line2: val }))} />
            <AddressField label="Landmark" placeholder="Nearby landmark" value={addressForm.landmark} onChange={(val) => setAddressForm(c => ({ ...c, landmark: val }))} />
            <AddressField label="Postal code" maxLength={6} placeholder="700001" required inputMode="numeric" value={addressForm.postal_code} onChange={(val) => {
              const pc = val.replace(/\D/g, "").slice(0, 6);
              setCityOptions([]);
              setCityStatus(pc.length >= 3 ? "loading" : "idle");
              setAddressForm(c => ({ ...c, city_id: "", postal_code: pc }));
            }} />

            {cityOptions.length > 1 ? (
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">City</span>
                <div className="relative">
                  <select required value={addressForm.city_id} onChange={(e) => setAddressForm(c => ({ ...c, city_id: e.target.value }))} className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-3 pr-8 text-[13px] font-semibold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20">
                    <option value="">Select city</option>
                    {cityOptions.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none" />
                </div>
              </label>
            ) : (
              <AddressField disabled label="City" placeholder="City" value={cityStatus === "loading" ? "Finding city..." : cityOptions[0]?.name ?? ""} onChange={() => undefined} />
            )}
          </div>

          <div className="mt-4 grid gap-3 rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-[13px] font-extrabold text-gray-900">Contact Person</h3>
            <AddressField label="Recipient name" placeholder="Full name" required value={addressForm.recipient_name} onChange={(val) => setAddressForm(c => ({ ...c, recipient_name: val }))} />
            <AddressField label="Phone number" placeholder="9876543210" prefix="+91" required type="tel" value={addressForm.phone} onChange={(val) => setAddressForm(c => ({ ...c, phone: val }))} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsAddressSheetOpen(false)}
              className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-[13px] font-bold uppercase tracking-wider text-gray-700 shadow-sm transition active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAddress || cityStatus === "loading" || !addressForm.city_id}
              className="flex h-12 items-center justify-center rounded-xl bg-primary text-[13px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              {savingAddress ? "Saving..." : "Save Address"}
            </button>
          </div>
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
      <span className={strong ? "text-[13px] font-extrabold text-gray-900" : "text-[11px] font-bold uppercase tracking-wider text-gray-500"}>
        {label}
      </span>
      <span
        className={`
          ${strong ? "text-[16px] font-black text-gray-900" : "text-[13px] font-bold"}
          ${isDiscount ? "text-blue-600" : (!strong && "text-gray-900")}
        `}
      >
        {value}
      </span>
    </div>
  );
}

function AddressField({
  disabled = false,
  inputMode,
  label,
  maxLength,
  onChange,
  placeholder,
  prefix,
  required = false,
  type = "text",
  value,
}: {
  disabled?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      <div className={`flex h-12 w-full overflow-hidden rounded-xl border border-gray-200 transition focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 ${disabled ? "bg-gray-100 opacity-80" : "bg-gray-50"}`}>
        {prefix && (
          <div className="flex h-full items-center border-r border-gray-200 bg-gray-100 px-3 text-[13px] font-bold text-gray-500">
            {prefix}
          </div>
        )}
        <input
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[13px] font-semibold text-gray-900 outline-none placeholder:font-medium placeholder:text-gray-400 disabled:text-gray-500"
        />
      </div>
    </label>
  );
}

function getFulfillmentColor(type: OrderFulfillmentType) {
  if (type === "pickup") return "bg-purple-50 text-purple-600 ring-1 ring-purple-500/20";
  if (type === "express_delivery") return "bg-orange-50 text-orange-600 ring-1 ring-orange-500/20";
  return "bg-blue-50 text-blue-600 ring-1 ring-blue-500/20";
}

function formatFulfillmentType(value: Order["fullfillment_type"]) {
  if (value === "pickup") return "Pickup";
  if (value === "express_delivery") return "Express";
  return "Scheduled";
}

function getOrderDeliveryAddress(order: Order) {
  if (order.fullfillment_type === "pickup") return null;
  return order.address ?? order.delivery_address ?? order.shipping_address ?? null;
}

function getDefaultAddressId(addresses: UserAddress[]) {
  return (
    addresses.find((address) => address.is_active && address.is_default)?.id ??
    addresses.find((address) => address.is_active)?.id ??
    ""
  );
}

function getAddressPayload(form: AddressFormValues): UserAddressPayload {
  return {
    address_type: form.address_type,
    custom_label: form.custom_label,
    recipient_name: form.recipient_name,
    phone: form.phone,
    address_line1: form.address_line1,
    address_line2: form.address_line2,
    landmark: form.landmark,
    city_id: Number(form.city_id),
    postal_code: form.postal_code,
    is_default: form.is_default,
    is_active: true,
  };
}

function getFulfillmentUpdateOptions(order: Order, settings: StoreSettings | null) {
  if (!settings) return [];
  const options: Array<{ label: string; type: OrderFulfillmentType }> = [];

  if (order.fullfillment_type !== "pickup" && settings.is_pickup_enabled) {
    options.push({ label: "Store Pickup", type: "pickup" });
  }
  if (order.fullfillment_type !== "scheduled_delivery" && settings.is_scheduled_delivery_enabled) {
    options.push({ label: "Scheduled Delivery", type: "scheduled_delivery" });
  }
  if (order.fullfillment_type !== "express_delivery" && settings.is_express_delivery_enabled) {
    options.push({ label: "Express Delivery", type: "express_delivery" });
  }
  return options;
}

function getDeliveryFeeForOrder(order: Order, settings: StoreSettings | null, type: OrderFulfillmentType) {
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

function getStatusColor(status: OrderStatus) {
  if (status === "placed") return "bg-blue-50 text-blue-600 ring-1 ring-blue-500/20";
  if (status === "accepted") return "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20";
  if (status === "preparing") return "bg-amber-50 text-amber-600 ring-1 ring-amber-500/20";
  if (status === "ready") return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20";
  if (status === "completed") return "bg-gray-100 text-gray-600 ring-1 ring-gray-300";
  if (status === "cancelled" || status === "rejected") return "bg-red-50 text-red-600 ring-1 ring-red-500/20";
  return "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
}

function formatStatus(status: Order["status"]) {
  return status.replace(/_/g, " ");
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
