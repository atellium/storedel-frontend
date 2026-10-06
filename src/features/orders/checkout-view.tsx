"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BottomSheetModal } from "@/components/modals";
import {
  createUserAddress,
  getCitiesByPincodePrefix,
  getUserAddresses,
  updateUserAddress,
  type UserAddress,
  type UserAddressCity,
  type UserAddressPayload,
} from "@/features/addresses/address-service";
import { AuthGuard } from "@/features/auth/auth-guard";
import { useAppSelector } from "@/store/hooks";
import {
  deleteCartItem,
  getStoreCart,
  updateCartItem,
  type Cart,
  type CartItem,
} from "@/features/cart/cart-service";
import {
  getStoreBySlug,
  getStoreSettings,
} from "@/features/stores/stores-service";
import { getDeliveryByText } from "@/features/stores/availability";
import type { StoreDetails, StoreSettings } from "@/features/stores/types";
import {
  createOrderFromCart,
  getOrders,
  type Order,
  type OrderFulfillmentType,
} from "./orders-service";

type FulfillmentMethod = "pickup" | "delivery";
type DeliveryMode = "scheduled" | "express";
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

export function CheckoutView({ storeSlug }: { storeSlug: string }) {
  return (
    <AuthGuard>
      <CheckoutContent storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function CheckoutContent({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [cart, setCart] = useState<Cart | null>(null);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [store, setStore] = useState<StoreDetails | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [addWithExisting, setAddWithExisting] = useState<boolean | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormValues>(emptyAddressForm);
  const [usingMyDetails, setUsingMyDetails] = useState(false);
  const [cityOptions, setCityOptions] = useState<UserAddressCity[]>([]);
  const [cityStatus, setCityStatus] = useState<"idle" | "loading" | "error">("idle");
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod>("pickup");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("scheduled");
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [customerNote, setCustomerNote] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const addressPostalCodePrefix = useMemo(
    () => addressForm.postal_code.trim().slice(0, 3),
    [addressForm.postal_code],
  );

  useEffect(() => {
    if (!addressSheetOpen || addressPostalCodePrefix.length < 3) {
      return;
    }

    let isMounted = true;

    getCitiesByPincodePrefix(addressPostalCodePrefix)
      .then((cities) => {
        if (!isMounted) return;
        setCityOptions(cities);
        setCityStatus("idle");
        setAddressForm((current) => ({
          ...current,
          city_id:
            cities.length === 1
              ? String(cities[0].id)
              : cities.some((city) => String(city.id) === current.city_id)
                ? current.city_id
                : "",
        }));
      })
      .catch(() => {
        if (!isMounted) return;
        setCityOptions([]);
        setCityStatus("error");
        setAddressForm((current) => ({ ...current, city_id: "" }));
      });

    return () => {
      isMounted = false;
    };
  }, [addressPostalCodePrefix, addressSheetOpen]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getStoreCart(storeSlug),
      getStoreSettings(storeSlug),
      getOrders(storeSlug),
      getUserAddresses(),
    ])
      .then(([nextCart, nextSettings, nextOrders, nextAddresses]) => {
        if (!isMounted) return;
        setCart(nextCart);
        setSettings(nextSettings);
        setAddresses(nextAddresses);
        setSelectedAddressId(getDefaultAddressId(nextAddresses));
        setExistingOrder(
          nextOrders.find(
            (order) => order.status === "placed" || order.status === "ready",
          ) ?? null,
        );

        if (nextSettings) {
          const canPickup = nextSettings.is_pickup_enabled;
          const canScheduled = nextSettings.is_scheduled_delivery_enabled;
          const canExpress = nextSettings.is_express_delivery_enabled;
          setFulfillmentMethod(canPickup ? "pickup" : "delivery");
          setDeliveryMode(
            canScheduled ? "scheduled" : canExpress ? "express" : "scheduled",
          );
        }

        if (nextCart) {
          setStore(null);
          setStatus("idle");
          return null;
        }

        return getStoreBySlug(storeSlug);
      })
      .then((nextStore) => {
        if (!isMounted) return;
        setStore(nextStore ?? null);
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

  const handleExistingOrderChoice = (value: boolean) => {
    setAddWithExisting(value);
    setMessage(null);

    if (value && existingOrder) {
      setCustomerNote(existingOrder.customer_note ?? "");
    }
  };

  const openAddressSheet = () => {
    setAddressForm(emptyAddressForm);
    setUsingMyDetails(false);
    setCityOptions([]);
    setCityStatus("idle");
    setEditingAddressId(null);
    setAddressSheetOpen(true);
    setMessage(null);
  };

  const openEditAddressSheet = (address: UserAddress) => {
    setAddressForm(getAddressFormFromAddress(address));
    setUsingMyDetails(false);
    setCityOptions([address.city]);
    setCityStatus("idle");
    setEditingAddressId(address.id);
    setAddressSheetOpen(true);
    setMessage(null);
  };

  const closeAddressSheet = () => {
    setAddressSheetOpen(false);
    setEditingAddressId(null);
  };

  const handleSaveAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!addressForm.city_id) {
      setMessage("Select a city before saving.");
      return;
    }

    setPendingItemId("address-save");
    setMessage(null);

    try {
      const payload = getAddressPayload(addressForm);
      const savedAddress = editingAddressId
        ? await updateUserAddress(editingAddressId, payload)
        : await createUserAddress(payload);
      setAddresses((current) =>
        editingAddressId
          ? current.map((address) =>
            address.id === savedAddress.id ? savedAddress : address,
          )
          : [savedAddress, ...current],
      );
      setSelectedAddressId(savedAddress.id);
      closeAddressSheet();
    } catch {
      setMessage("Could not save address.");
    } finally {
      setPendingItemId(null);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0 || isPlacingOrder) return;
    if (existingOrder && addWithExisting === null) {
      setMessage("Choose whether to add to your existing order or place separately.");
      return;
    }

    const activeFulfillmentType = getActiveFulfillmentType(
      addWithExisting,
      existingOrder,
      fulfillmentMethod,
      deliveryMode,
    );
    const needsAddress = shouldSelectDeliveryAddress(
      addWithExisting,
      existingOrder,
      activeFulfillmentType,
    );

    if (needsAddress && !selectedAddressId) {
      setMessage("Select a delivery address before placing your order.");
      return;
    }

    setIsPlacingOrder(true);
    setMessage(null);

    try {
      const payload = {
        add_with_existing: addWithExisting ?? false,
        ...(needsAddress ? { address_id: selectedAddressId } : {}),
        cart_id: cart.id,
        fullfillment_type: activeFulfillmentType,
        delivery_fee: getActiveDeliveryFee(
          addWithExisting,
          existingOrder,
          cart.subtotal,
          settings,
          fulfillmentMethod,
          deliveryMode,
        ),
        customer_note: customerNote.trim(),
      };

      const order = await createOrderFromCart(payload);
      router.push(`/${storeSlug}/orders/${order.order_number}/success`);
    } catch {
      setMessage("Could not place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleUpdateItem = async (item: CartItem, nextValue: number) => {
    const isCustomItem = item.custom_value !== null;

    if (!isCustomItem && nextValue < 1) {
      await handleDeleteItem(item);
      return;
    }

    const minimumValue = item.quantity_step ?? 1;
    if (isCustomItem && nextValue < minimumValue) return;

    setPendingItemId(item.id);
    setMessage(null);

    try {
      const nextCart = await updateCartItem(
        item.id,
        isCustomItem
          ? { custom_value: nextValue, quantity: 1 }
          : { quantity: nextValue },
      );
      setCart(nextCart);
    } catch {
      setMessage("Could not update item.");
    } finally {
      setPendingItemId(null);
    }
  };

  const handleDeleteItem = async (item: CartItem) => {
    setPendingItemId(item.id);
    setMessage(null);

    try {
      const nextCart = await deleteCartItem(item.id);
      setCart(nextCart);
    } catch {
      setMessage("Could not remove item.");
    } finally {
      setPendingItemId(null);
    }
  };

  const itemCount = cart?.item_count ?? 0;
  const cartItems = cart?.items ?? [];
  const storeName = cart?.store.name ?? store?.name ?? "Your store";
  const deliveryFee = cart
    ? getActiveDeliveryFee(
      addWithExisting,
      existingOrder,
      cart.subtotal,
      settings,
      fulfillmentMethod,
      deliveryMode,
    )
    : 0;
  const existingItemTotal = addWithExisting ? existingOrder?.subtotal ?? 0 : 0;
  const grandTotal = existingItemTotal + (cart?.subtotal ?? 0) + deliveryFee;
  const activeFulfillmentType = getActiveFulfillmentType(
    addWithExisting,
    existingOrder,
    fulfillmentMethod,
    deliveryMode,
  );
  const shouldSelectAddress = shouldSelectDeliveryAddress(
    addWithExisting,
    existingOrder,
    activeFulfillmentType,
  );
  const isPlaceOrderDisabled =
    cartItems.length === 0 ||
    isPlacingOrder ||
    (shouldSelectAddress && !selectedAddressId);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex h-10 items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-base" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 text-left">
            <h1 className="truncate text-base font-black leading-tight text-gray-900">
              Checkout
            </h1>
            <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-wider text-primary">
              {storeName}
            </p>
          </div>
        </div>
      </header>

      <section className={`px-3 pt-5 ${cartItems.length ? "pb-32" : "pb-5"}`}>
        {status === "loading" && (
          <div className="rounded-[20px] border border-gray-100 bg-white px-3 py-8 text-center text-sm font-medium text-gray-500 shadow-sm">
            Loading checkout...
          </div>
        )}

        {status === "error" && (
          <div className="rounded-[20px] border border-red-100 bg-red-50 px-3 py-8 text-center text-sm font-bold text-red-500 shadow-sm">
            Could not load checkout.
          </div>
        )}

        {status === "idle" && (
          <div className="space-y-3">

            {/* Cart Items List */}
            <div className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-3 py-3">
                <h2 className="text-[15px] font-extrabold text-gray-900">Cart Details</h2>
                <span className="flex h-6 items-center justify-center rounded-full bg-gray-200/60 px-2.5 text-[11px] font-extrabold text-gray-600">
                  {itemCount} {itemCount === 1 ? "Item" : "Items"}
                </span>
              </div>

              {cartItems.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {cartItems.map((item) => (
                    <CartRow
                      key={item.id}
                      item={item}
                      onDelete={handleDeleteItem}
                      onUpdate={handleUpdateItem}
                      pending={pendingItemId === item.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center px-6 py-10 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                    <i className="fa-solid fa-basket-shopping text-xl" aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-[15px] font-extrabold text-gray-900">
                    Your cart is empty
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    Add products to continue checkout.
                  </p>
                </div>
              )}
            </div>

            {cart && cartItems.length > 0 && (
              <>
                {settings && (
                  <>
                    {/* Existing Order Option */}
                    {existingOrder && (
                      <ExistingOrderChoice
                        addWithExisting={addWithExisting}
                        existingOrder={existingOrder}
                        onChange={handleExistingOrderChoice}
                      />
                    )}

                    {/* Fulfillment Selection */}
                    {(!existingOrder || addWithExisting === false) && (
                      <FulfillmentSection
                        deliveryMode={deliveryMode}
                        fulfillmentMethod={fulfillmentMethod}
                        onDeliveryModeChange={setDeliveryMode}
                        onFulfillmentMethodChange={setFulfillmentMethod}
                        settings={settings}
                        subtotal={cart.subtotal}
                      />
                    )}

                    {/* Address Selection */}
                    {shouldSelectAddress && (
                      <AddressSelection
                        addresses={addresses}
                        onAddNew={openAddressSheet}
                        selectedAddressId={selectedAddressId}
                        onChange={setSelectedAddressId}
                        onEdit={openEditAddressSheet}
                      />
                    )}
                  </>
                )}

                {(!existingOrder || addWithExisting !== null) && (
                  <>
                    {/* Bill Details */}
                    <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                      <h2 className="text-[15px] font-extrabold text-gray-900">
                        Bill Details
                      </h2>
                      <div className="mt-4 space-y-3.5">
                        {addWithExisting && existingOrder && (
                          <BillRow label="Existing item total" value={formatPrice(existingOrder.subtotal)} />
                        )}
                        <BillRow label={addWithExisting ? "New item total" : "Item total"} value={formatPrice(cart.subtotal)} />

                        {shouldDisplayDeliveryFee(
                          addWithExisting,
                          existingOrder,
                          fulfillmentMethod,
                        ) && (
                            <BillRow
                              label="Delivery fee"
                              value={deliveryFee > 0 ? formatPrice(deliveryFee) : <span className="text-blue-600">Free</span>}
                            />
                          )}
                        <div className="border-t border-dashed border-gray-200 pt-3.5">
                          <BillRow label="Grand Total" value={formatPrice(grandTotal)} strong />
                        </div>
                      </div>
                    </div>

                    {/* Customer Note */}
                    <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                      <label
                        htmlFor="customer_note"
                        className="text-[13px] font-extrabold text-gray-900"
                      >
                        Delivery Note
                      </label>
                      <textarea
                        id="customer_note"
                        value={customerNote}
                        onChange={(event) => setCustomerNote(event.target.value)}
                        rows={3}
                        placeholder="Any instructions? e.g. Ring the bell."
                        className="mt-3 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-[13px] font-semibold text-gray-900 outline-none transition placeholder:font-medium placeholder:text-gray-400 focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {message && (
              <div className="flex items-center gap-3 rounded-[16px] border border-red-100/50 bg-red-50/80 px-3 py-3 text-[13px] font-bold text-red-600 shadow-sm">
                <i className="fa-solid fa-circle-exclamation" />
                {message}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Fixed Bottom Action Bar */}
      {status === "idle" &&
        cart &&
        cartItems.length > 0 &&
        (!existingOrder || addWithExisting !== null) && (
          <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[640px] border-t border-gray-100 bg-white px-3 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isPlaceOrderDisabled}
              className="flex h-[52px] w-full items-center justify-between rounded-xl bg-primary px-3 text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] font-bold text-white/80">TOTAL</span>
                <span className="text-[16px] font-black tracking-tight">{formatPrice(grandTotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold uppercase tracking-wider">
                  {isPlacingOrder ? "Placing..." : "Place Order"}
                </span>
                {!isPlacingOrder && <i className="fa-solid fa-chevron-right text-[11px]" />}
              </div>
            </button>
          </div>
        )}

      <BottomSheetModal
        open={addressSheetOpen}
        onClose={closeAddressSheet}
        title={editingAddressId ? "Edit Address" : "Add Address"}
      >
        <CheckoutAddressForm
          cityOptions={cityOptions}
          cityStatus={cityStatus}
          form={addressForm}
          mode={editingAddressId ? "edit" : "add"}
          onCancel={closeAddressSheet}
          onChange={(field, value) =>
            setAddressForm((current) => {
              if (
                field === "postal_code" &&
                typeof value === "string"
              ) {
                const postalCode = value.replace(/\D/g, "").slice(0, 6);
                const currentPrefix = current.postal_code.trim().slice(0, 3);
                const nextPrefix = postalCode.trim().slice(0, 3);

                if (postalCode.trim().length < 3) {
                  setCityOptions([]);
                  setCityStatus("idle");
                  return { ...current, postal_code: postalCode, city_id: "" };
                }

                if (nextPrefix !== currentPrefix) {
                  setCityStatus("loading");
                }

                return { ...current, postal_code: postalCode };
              }

              return { ...current, [field]: value };
            })
          }
          onSubmit={handleSaveAddress}
          onUseMyDetails={(checked) => {
            setUsingMyDetails(checked);
            if (!checked) return;
            setAddressForm((current) => ({
              ...current,
              recipient_name: user?.full_name ?? current.recipient_name,
              phone: getPhoneWithoutCountryCode(user?.phone) || current.phone,
            }));
          }}
          pending={pendingItemId === "address-save"}
          hideUseMyDetails={
            Boolean(editingAddressId) && phonesMatch(addressForm.phone, user?.phone)
          }
          selectedCity={
            cityOptions.find((city) => String(city.id) === addressForm.city_id) ?? null
          }
          usingMyDetails={usingMyDetails}
          userHasDetails={Boolean(user?.full_name || user?.phone)}
        />
      </BottomSheetModal>
    </main>
  );
}

type CartItemWithImage = CartItem & {
  product_image_url?: string | null;
};

function CartRow({
  item,
  onDelete,
  onUpdate,
  pending,
}: {
  item: CartItem;
  onDelete: (item: CartItem) => void;
  onUpdate: (item: CartItem, nextValue: number) => void;
  pending: boolean;
}) {
  const isCustomItem = item.custom_value !== null;
  const step = item.quantity_step ?? 1;
  const value = isCustomItem ? item.custom_value ?? step : item.quantity;
  const label = isCustomItem
    ? formatMeasuredQuantity(value, item.measurement_type, item.unit)
    : String(item.quantity);
  const imageSource = getCartItemImage(item);

  return (
    <div className="flex items-start gap-3 px-3 py-4 transition-colors hover:bg-gray-50/50">
      <div className="relative size-[60px] shrink-0 overflow-hidden rounded-[14px] bg-gray-50 border border-gray-100">
        <Image
          src={imageSource}
          alt={item.product_name}
          fill
          sizes="60px"
          className="object-contain p-1.5 mix-blend-multiply"
        />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="line-clamp-2 text-[13px] font-extrabold leading-snug text-gray-900">
          {item.product_name}
        </h3>
        <p className="mt-0.5 text-[11px] font-medium text-gray-500">
          {item.display_measurement}
        </p>
        <p className="mt-2 text-[14px] font-black text-gray-900">
          {formatPrice(item.total_price)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-3 pt-0.5">
        <div className="flex h-8 min-w-[76px] shrink-0 items-center justify-between rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm">
          <button
            type="button"
            onClick={() => onUpdate(item, value - step)}
            aria-label="Decrease cart item"
            disabled={pending || (isCustomItem && value <= step)}
            className="flex h-full w-8 items-center justify-center text-gray-500 transition hover:text-primary active:scale-95 disabled:opacity-50"
          >
            <i className="fa-solid fa-minus text-[10px]" aria-hidden="true" />
          </button>
          <span className="min-w-[16px] px-0.5 text-center text-[11px] font-extrabold leading-none">
            {label}
          </span>
          <button
            type="button"
            onClick={() => onUpdate(item, value + step)}
            aria-label="Increase cart item"
            disabled={pending}
            className="flex h-full w-8 items-center justify-center text-primary transition hover:text-primary/80 active:scale-95 disabled:opacity-50"
          >
            <i className="fa-solid fa-plus text-[10px]" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onDelete(item)}
          disabled={pending}
          className="text-[10px] font-bold uppercase tracking-wider text-red-400 transition-colors hover:text-red-600 disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function getCartItemImage(item: CartItem) {
  const imageItem = item as CartItemWithImage;
  return imageItem.product_image_url ?? "/images/default_product.webp";
}

function ExistingOrderChoice({
  addWithExisting,
  existingOrder,
  onChange,
}: {
  addWithExisting: boolean | null;
  existingOrder: Order;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <h2 className="text-[15px] font-extrabold text-gray-900">
        Existing Order Found
      </h2>
      <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-500">
        Order #{existingOrder.order_number} is {existingOrder.status}. Add these
        items to it or place a separate order.
      </p>
      <div className="mt-4 grid gap-2.5">
        {[
          { val: true, title: "Add with existing order", desc: `New items added to Order #${existingOrder.order_number}` },
          { val: false, title: "Place a separate order", desc: "Create a brand new order for these items." },
        ].map((opt) => {
          const active = addWithExisting === opt.val;
          return (
            <div
              key={String(opt.val)}
              onClick={() => onChange(opt.val)}
              role="button"
              tabIndex={0}
              className={`relative flex cursor-pointer items-start gap-3 rounded-[16px] border p-3 transition-all ${active
                  ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                  : "border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50"
                }`}
            >
              <div className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors ${active ? "border-primary bg-primary" : "border-gray-300 bg-white"
                }`}>
                {active && <span className="size-1.5 rounded-full bg-white shadow-sm" />}
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block text-[13px] font-extrabold ${active ? "text-primary" : "text-gray-900"}`}>
                  {opt.title}
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-gray-500">
                  {opt.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FulfillmentSection({
  deliveryMode,
  fulfillmentMethod,
  onDeliveryModeChange,
  onFulfillmentMethodChange,
  settings,
  subtotal,
}: {
  deliveryMode: DeliveryMode;
  fulfillmentMethod: FulfillmentMethod;
  onDeliveryModeChange: (mode: DeliveryMode) => void;
  onFulfillmentMethodChange: (method: FulfillmentMethod) => void;
  settings: StoreSettings;
  subtotal: number;
}) {
  const canPickup = settings.is_pickup_enabled;
  const canScheduled = settings.is_scheduled_delivery_enabled;
  const canExpress = settings.is_express_delivery_enabled;
  const scheduledFee =
    subtotal < settings.scheduled_min_order_amount
      ? settings.scheduled_delivery_charge
      : 0;
  const expressFee =
    subtotal < settings.express_min_order_amount
      ? settings.express_delivery_charge
      : 0;

  return (
    <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <h2 className="text-[15px] font-extrabold text-gray-900">Order Fulfillment</h2>

      <div className="mt-4 space-y-2.5">
        {canPickup && (
          <FulfillmentOption
            active={fulfillmentMethod === "pickup"}
            charge={0}
            description={`Ready in ${settings.pickup_min_preparation_minutes}-${settings.pickup_max_preparation_minutes} min`}
            icon="fa-person-walking"
            onClick={() => onFulfillmentMethodChange("pickup")}
            title="Store Pickup"
            unavailableMessage={getUnavailableMessage(
              settings.is_pickup_temporarily_disabled,
              settings.pickup_disable_till,
            )}
          />
        )}

        {canExpress && (
          <FulfillmentOption
            active={fulfillmentMethod === "delivery" && deliveryMode === "express"}
            charge={expressFee}
            description={`Arrives in ${settings.express_min_delivery_minutes}-${settings.express_max_delivery_minutes} min.`}
            icon="fa-motorcycle"
            minimum={settings.express_min_order_amount}
            subtotal={subtotal}
            onClick={() => {
              onFulfillmentMethodChange("delivery");
              onDeliveryModeChange("express");
            }}
            title="Express Delivery"
            unavailableMessage={getUnavailableMessage(
              settings.is_express_delivery_temporarily_disabled,
              settings.express_delivery_disable_till,
            )}
          />
        )}

        {canScheduled && (
          <FulfillmentOption
            active={fulfillmentMethod === "delivery" && deliveryMode === "scheduled"}
            charge={scheduledFee}
            description={getDeliveryByText(settings)}
            icon="fa-calendar-check"
            minimum={settings.scheduled_min_order_amount}
            subtotal={subtotal}
            onClick={() => {
              onFulfillmentMethodChange("delivery");
              onDeliveryModeChange("scheduled");
            }}
            title="Scheduled Delivery"
          />
        )}
      </div>
    </div>
  );
}

function AddressSelection({
  addresses,
  onAddNew,
  onChange,
  onEdit,
  selectedAddressId,
}: {
  addresses: UserAddress[];
  onAddNew: () => void;
  onChange: (addressId: string) => void;
  onEdit: (address: UserAddress) => void;
  selectedAddressId: string;
}) {
  const activeAddresses = addresses.filter((address) => address.is_active);

  return (
    <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold text-gray-900">Delivery Address</h2>
        <button
          type="button"
          onClick={onAddNew}
          className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-primary transition hover:bg-primary/20 active:scale-95"
        >
          + Add New
        </button>
      </div>

      {activeAddresses.length > 0 ? (
        <div className="mt-4 space-y-2.5">
          {activeAddresses.map((address) => {
            const active = selectedAddressId === address.id;

            return (
              <div
                key={address.id}
                onClick={() => onChange(address.id)}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                className={`relative flex cursor-pointer items-start gap-3 rounded-[16px] border p-3 transition-all ${active
                    ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                    : "border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <div
                  className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors ${active ? "border-primary bg-primary" : "border-gray-300 bg-white"
                    }`}
                >
                  {active && <span className="size-1.5 rounded-full bg-white shadow-sm" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-[13px] font-extrabold ${active ? "text-primary" : "text-gray-900"}`}>
                      {address.label}
                      {address.is_default && (
                        <span className="ml-2 inline-flex items-center rounded bg-gray-200/60 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gray-600">
                          Default
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(address);
                      }}
                      className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-400 transition hover:text-primary active:scale-95"
                    >
                      Edit
                    </button>
                  </div>

                  <span className="mt-1 block text-[11px] font-semibold text-gray-700">
                    {address.recipient_name} <span className="mx-1 text-gray-300">•</span> {address.phone}
                  </span>

                  <span className="mt-1 block line-clamp-2 text-[10px] font-medium leading-snug text-gray-500">
                    {address.full_address}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[16px] border border-dashed border-gray-200 bg-gray-50/50 px-3 py-6 text-center">
          <p className="text-[13px] font-bold text-gray-900">No delivery address found</p>
          <p className="mt-1 text-[11px] font-medium text-gray-500">
            Add an address before placing a home delivery order.
          </p>
          <button
            type="button"
            onClick={onAddNew}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-primary px-5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-95 hover:bg-primary/90"
          >
            Add Address
          </button>
        </div>
      )}
    </div>
  );
}

function CheckoutAddressForm({
  cityOptions,
  cityStatus,
  form,
  mode,
  onCancel,
  onChange,
  onSubmit,
  onUseMyDetails,
  pending,
  hideUseMyDetails,
  selectedCity,
  usingMyDetails,
  userHasDetails,
}: {
  cityOptions: UserAddressCity[];
  cityStatus: "idle" | "loading" | "error";
  form: AddressFormValues;
  mode: "add" | "edit";
  onCancel: () => void;
  onChange: (field: keyof AddressFormValues, value: string | boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onUseMyDetails: (checked: boolean) => void;
  pending: boolean;
  hideUseMyDetails: boolean;
  selectedCity: UserAddressCity | null;
  usingMyDetails: boolean;
  userHasDetails: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 px-3 pb-6 pt-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
          {mode === "edit" ? "Edit Address" : "New Address"}
        </p>
        <h2 className="mt-1 text-2xl font-black text-gray-900">
          {mode === "edit" ? "Update Details" : "Delivery Details"}
        </h2>
      </div>

      <div className="grid gap-3 rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <h3 className="text-[13px] font-extrabold text-gray-900">Address Information</h3>
        <CheckoutField label="Address line 1" placeholder="House number, building, street" required value={form.address_line1} onChange={(value) => onChange("address_line1", value)} />
        <CheckoutField label="Address line 2" placeholder="Area, colony, apartment" value={form.address_line2} onChange={(value) => onChange("address_line2", value)} />
        <CheckoutField label="Landmark" placeholder="Nearby landmark" value={form.landmark} onChange={(value) => onChange("landmark", value)} />
        <CheckoutField label="Postal code" maxLength={6} placeholder="700001" required inputMode="numeric" value={form.postal_code} onChange={(value) => onChange("postal_code", value)} />

        {cityOptions.length > 1 ? (
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-500">City</span>
            <div className="relative">
              <select required value={form.city_id} onChange={(event) => onChange("city_id", event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-3 pr-8 text-[13px] font-semibold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20">
                <option value="">Select city</option>
                {cityOptions.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none" />
            </div>
          </label>
        ) : (
          <CheckoutField label="City" placeholder="City" disabled value={cityStatus === "loading" ? "Finding city..." : cityOptions[0]?.name ?? ""} onChange={() => undefined} />
        )}

        <CheckoutField label="State" placeholder="State" disabled value={selectedCity?.state.name ?? ""} onChange={() => undefined} />

        <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition active:bg-gray-50">
          <input type="checkbox" checked={form.is_default} onChange={(event) => onChange("is_default", event.target.checked)} className="size-4 rounded accent-primary" />
          <span className="text-[13px] font-bold text-gray-900">Set as default</span>
        </label>

        <div className="pt-2">
          <AddressTypeTabs value={form.address_type} onChange={(value) => onChange("address_type", value)} />
        </div>

        {form.address_type === "other" && (
          <CheckoutField label="Custom label" placeholder="e.g. Parents, Office" value={form.custom_label} onChange={(value) => onChange("custom_label", value)} />
        )}
      </div>

      <div className="grid gap-3 rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <h3 className="text-[13px] font-extrabold text-gray-900">Contact Person</h3>
        {!hideUseMyDetails && (
          <label className="mb-1 flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition active:bg-gray-50">
            <input
              type="checkbox"
              checked={usingMyDetails}
              onChange={(event) => onUseMyDetails(event.target.checked)}
              disabled={!userHasDetails}
              className="size-4 rounded accent-primary disabled:opacity-50"
            />
            <span className="text-[13px] font-bold text-gray-900">Use my name and phone</span>
          </label>
        )}
        <CheckoutField disabled={usingMyDetails} label="Recipient name" placeholder="Full name" required value={form.recipient_name} onChange={(value) => onChange("recipient_name", value)} />
        <CheckoutField disabled={usingMyDetails} label="Phone number" placeholder="9876543210" prefix="+91" required type="tel" value={form.phone} onChange={(value) => onChange("phone", value)} />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-[13px] font-bold uppercase tracking-wider text-gray-700 shadow-sm transition active:scale-[0.98]">
          Cancel
        </button>
        <button type="submit" disabled={pending || cityStatus === "loading"} className="flex h-12 items-center justify-center rounded-xl bg-primary text-[13px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100">
          {pending ? "Saving..." : "Save Address"}
        </button>
      </div>
    </form>
  );
}

function CheckoutField({
  disabled = false,
  inputMode,
  label,
  onChange,
  placeholder,
  prefix,
  maxLength,
  required = false,
  type = "text",
  value,
}: {
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  maxLength?: number;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      <div className={`flex h-12 w-full overflow-hidden rounded-xl border border-gray-200 transition-colors focus-within:border-primary/50 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20 ${disabled ? 'bg-gray-100 opacity-80' : 'bg-gray-50'}`}>
        {prefix && (
          <div className="flex h-full items-center border-r border-gray-200 px-3 text-[13px] font-bold text-gray-500 bg-gray-100">
            {prefix}
          </div>
        )}
        <input disabled={disabled} inputMode={inputMode} maxLength={maxLength} placeholder={placeholder} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[13px] font-semibold text-gray-900 outline-none placeholder:font-medium placeholder:text-gray-400 disabled:text-gray-500" />
      </div>
    </label>
  );
}

function AddressTypeTabs({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Address type</span>
      <div className="flex h-11 w-full gap-1 rounded-[12px] bg-gray-100 p-1">
        {[
          { id: "home", label: "Home", icon: "fa-house" },
          { id: "work", label: "Work", icon: "fa-briefcase" },
          { id: "other", label: "Other", icon: "fa-location-dot" },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={value === opt.id}
            className={`flex h-full flex-1 items-center justify-center gap-1.5 rounded-[8px] text-[11px] font-bold uppercase tracking-wider transition-all ${value === opt.id
                ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
          >
            <i className={`fa-solid ${opt.icon} text-[10px] ${value === opt.id ? 'text-primary' : 'opacity-70'}`} />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
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

function getAddressFormFromAddress(address: UserAddress): AddressFormValues {
  return {
    address_type: address.address_type,
    custom_label: address.custom_label,
    recipient_name: address.recipient_name,
    phone: getPhoneWithoutCountryCode(address.phone),
    address_line1: address.address_line1,
    address_line2: address.address_line2,
    landmark: address.landmark,
    city_id: String(address.city.id),
    postal_code: address.postal_code,
    is_default: address.is_default,
  };
}

function getPhoneWithoutCountryCode(phone?: string | null) {
  return (phone ?? "").replace(/^\+?91[\s-]?/, "");
}

function phonesMatch(left?: string | null, right?: string | null) {
  return getPhoneWithoutCountryCode(left).replace(/\D/g, "") ===
    getPhoneWithoutCountryCode(right).replace(/\D/g, "");
}

function FulfillmentOption({
  active,
  charge,
  description,
  icon,
  minimum,
  onClick,
  subtotal,
  title,
  unavailableMessage,
}: {
  active: boolean;
  charge: number;
  description: string;
  icon: string;
  minimum?: number;
  onClick: () => void;
  subtotal?: number;
  title: string;
  unavailableMessage?: string | null;
}) {
  const freeDeliveryText =
    minimum !== undefined && subtotal !== undefined && subtotal < minimum
      ? `Add ${formatPrice(minimum - subtotal)} for free delivery`
      : null;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      className={`relative flex cursor-pointer items-start gap-3 rounded-[16px] border p-3 transition-all ${active
          ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50"
        }`}
    >
      <div className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors ${active ? "border-primary bg-primary" : "border-gray-300 bg-white"
        }`}>
        {active && <span className="size-1.5 rounded-full bg-white shadow-sm" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[13px] font-extrabold ${active ? 'text-primary' : 'text-gray-900'}`}>
            <i className={`fa-solid ${icon} mr-1.5 opacity-70`} />
            {title}
          </span>
          <span className={`shrink-0 text-[11px] font-extrabold ${active ? 'text-primary' : 'text-gray-500'}`}>
            {charge > 0 ? formatPrice(charge) : "Free"}
          </span>
        </div>

        <p className="mt-0.5 text-[11px] font-medium leading-snug text-gray-500">
          {description}
        </p>

        {freeDeliveryText && (
          <div className="mt-2">
            <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-500/20">
              {freeDeliveryText}
            </span>
          </div>
        )}

        {unavailableMessage && (
          <div className="mt-2">
            <span className="inline-flex rounded-md bg-red-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-600 ring-1 ring-red-500/20">
              {unavailableMessage}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function getUnavailableMessage(disabled: boolean, disableTill?: string | null) {
  if (!disabled) return null;
  if (!disableTill) return "Currently unavailable.";

  return `Available from ${formatDateTime(disableTill)}.`;
}

function getDeliveryFee(
  subtotal: number,
  settings: StoreSettings | null,
  fulfillmentMethod: FulfillmentMethod,
  deliveryMode: DeliveryMode,
) {
  if (!settings || fulfillmentMethod !== "delivery") return 0;

  if (deliveryMode === "express") {
    return subtotal < settings.express_min_order_amount
      ? settings.express_delivery_charge
      : 0;
  }

  return subtotal < settings.scheduled_min_order_amount
    ? settings.scheduled_delivery_charge
    : 0;
}

function getActiveFulfillmentType(
  addWithExisting: boolean | null,
  existingOrder: Order | null,
  fulfillmentMethod: FulfillmentMethod,
  deliveryMode: DeliveryMode,
) {
  if (addWithExisting && existingOrder) return existingOrder.fullfillment_type;

  return getOrderFulfillmentType(fulfillmentMethod, deliveryMode);
}

function getActiveDeliveryFee(
  addWithExisting: boolean | null,
  existingOrder: Order | null,
  subtotal: number,
  settings: StoreSettings | null,
  fulfillmentMethod: FulfillmentMethod,
  deliveryMode: DeliveryMode,
) {
  if (addWithExisting && existingOrder) {
    if (!settings || existingOrder.fullfillment_type === "pickup") return 0;

    const combinedSubtotal = existingOrder.subtotal + subtotal;

    if (existingOrder.fullfillment_type === "express_delivery") {
      return combinedSubtotal < settings.express_min_order_amount
        ? settings.express_delivery_charge
        : 0;
    }

    return combinedSubtotal < settings.scheduled_min_order_amount
      ? settings.scheduled_delivery_charge
      : 0;
  }

  return getDeliveryFee(subtotal, settings, fulfillmentMethod, deliveryMode);
}

function shouldDisplayDeliveryFee(
  addWithExisting: boolean | null,
  existingOrder: Order | null,
  fulfillmentMethod: FulfillmentMethod,
) {
  if (addWithExisting && existingOrder) {
    return existingOrder.fullfillment_type !== "pickup";
  }

  return fulfillmentMethod === "delivery";
}

function getOrderFulfillmentType(
  fulfillmentMethod: FulfillmentMethod,
  deliveryMode: DeliveryMode,
): OrderFulfillmentType {
  if (fulfillmentMethod === "pickup") return "pickup";
  return deliveryMode === "express"
    ? "express_delivery"
    : "scheduled_delivery";
}

function isDeliveryFulfillment(fulfillmentType: OrderFulfillmentType) {
  return fulfillmentType === "scheduled_delivery" || fulfillmentType === "express_delivery";
}

function shouldSelectDeliveryAddress(
  addWithExisting: boolean | null,
  existingOrder: Order | null,
  fulfillmentType: OrderFulfillmentType,
) {
  if (existingOrder && addWithExisting === null) return false;
  if (addWithExisting) return false;
  return isDeliveryFulfillment(fulfillmentType);
}

function getDefaultAddressId(addresses: UserAddress[]) {
  return (
    addresses.find((address) => address.is_active && address.is_default)?.id ??
    addresses.find((address) => address.is_active)?.id ??
    ""
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(price);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMeasuredQuantity(
  value: number,
  measurementType: string,
  unit: string,
) {
  if (measurementType === "weight" || unit === "g" || unit === "kg") {
    if (value >= 1000) return `${formatCompactNumber(value / 1000)} kg`;
    return `${formatCompactNumber(value)} g`;
  }

  if (measurementType === "volume" || unit === "ml" || unit === "l") {
    if (value >= 1000) return `${formatCompactNumber(value / 1000)} l`;
    return `${formatCompactNumber(value)} ml`;
  }

  return `${formatCompactNumber(value)} ${unit}`.trim();
}

function formatCompactNumber(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/\.?0+$/, "");
}

function BillRow({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? "text-[13px] font-extrabold text-gray-900" : "text-[11px] font-bold uppercase tracking-wider text-gray-500"}>
        {label}
      </span>
      <span className={`${strong ? "text-[16px] font-black" : "text-[13px] font-bold"} text-gray-900`}>
        {value}
      </span>
    </div>
  );
}
