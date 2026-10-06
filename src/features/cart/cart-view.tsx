"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StoreBottomNav } from "@/components/store-bottom-nav";
import { AuthGuard } from "@/features/auth/auth-guard";
import {
  deleteCartItem,
  getStoreCart,
  updateCartItem,
  type Cart,
  type CartItem,
} from "./cart-service";

export function CartView({ storeSlug }: { storeSlug: string }) {
  return (
    <AuthGuard>
      <CartContent storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function CartContent({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getStoreCart(storeSlug)
      .then((nextCart) => {
        if (!isMounted) return;
        setCart(nextCart);
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

    const payload = {
        ...(isCustomItem
          ? { custom_value: nextValue, quantity: 1 }
          : { quantity: nextValue }),
      };

    if (isCustomItem) {
      console.log("Custom cart update payload", {
        item_id: item.id,
        payload,
      });
    }

    try {
      const nextCart = await updateCartItem(item.id, payload);
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

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="grid h-15 grid-cols-[auto_1fr_auto] items-center gap-3 px-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          </button>
          <h1 className="text-center text-lg font-bold text-gray-900">Cart</h1>
          <Link
            href={`/${storeSlug}`}
            className="inline-flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-primary shadow-sm transition active:scale-95"
            aria-label="Store"
          >
            <i className="fa-solid fa-store" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="px-3 pb-28 pt-5">
        {status === "loading" && (
          <div className="rounded-[20px] border border-gray-100 bg-white px-4 py-5 text-sm font-semibold text-gray-500 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            Loading cart...
          </div>
        )}

        {status === "error" && (
          <div className="rounded-[20px] border border-gray-100 bg-white px-4 py-5 text-sm font-semibold text-gray-500 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            Could not load cart.
          </div>
        )}

        {message && (
          <div className="mb-3 rounded-[20px] border border-gray-100 bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm">
            {message}
          </div>
        )}

        {status === "idle" && cart && (
          <>
            <div className="rounded-[20px] border border-gray-100 bg-white px-4 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <p className="text-sm font-semibold text-secondary">
                {cart.store.name}
              </p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  {cart.item_count} items
                </h2>
                <p className="text-lg font-extrabold text-primary">
                  {formatPrice(cart.subtotal)}
                </p>
              </div>
              <Link
                href={`/${storeSlug}/checkout`}
                className={`mt-4 flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold ${
                  cart.items.length > 0
                    ? "bg-primary text-white shadow-sm transition active:scale-[0.98]"
                    : "pointer-events-none bg-gray-200 text-gray-500"
                }`}
              >
                Proceed to checkout
              </Link>
            </div>

            {cart.items.length > 0 ? (
              <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                {cart.items.map((item) => (
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
              <div className="mt-4 rounded-[20px] border border-gray-100 bg-white px-4 py-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <p className="text-sm font-semibold text-secondary">
                  Your cart is empty.
                </p>
                <Link
                  href={`/${storeSlug}`}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
                >
                  Add products
                </Link>
              </div>
            )}
          </>
        )}
      </section>

      <StoreBottomNav cartItemCount={cart?.item_count ?? 0} storeSlug={storeSlug} />
    </main>
  );
}

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

  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-primary ring-1 ring-gray-100">
        <i className="fa-solid fa-basket-shopping" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-gray-900">
          {item.product_name}
        </h3>
        <p className="mt-1 text-xs font-semibold text-secondary">
          {item.display_measurement}
        </p>
        <p className="mt-2 text-sm font-bold text-gray-900">
          {formatPrice(item.total_price)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex h-9 items-center rounded-full border border-primary bg-primary/5 text-primary">
          <button
            type="button"
            onClick={() => onUpdate(item, value - step)}
            aria-label="Decrease cart item"
            disabled={pending || (isCustomItem && value <= step)}
            className="flex size-9 items-center justify-center disabled:text-secondary"
          >
            <i className="fa-solid fa-minus text-xs" aria-hidden="true" />
          </button>
          <span className="min-w-12 px-1 text-center text-xs font-extrabold">
            {label}
          </span>
          <button
            type="button"
            onClick={() => onUpdate(item, value + step)}
            aria-label="Increase cart item"
            disabled={pending}
            className="flex size-9 items-center justify-center disabled:text-secondary"
          >
            <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onDelete(item)}
          disabled={pending}
          className="text-xs font-bold text-secondary"
        >
          Remove
        </button>
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
