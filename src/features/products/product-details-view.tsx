"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthModal } from "@/features/auth/auth-modal";
import { hasAuthTokens } from "@/features/auth/token";
import {
  addCartItem,
  deleteCartItem,
  getStoreCart,
  updateCartItem,
  type Cart,
  type CartItem,
} from "@/features/cart/cart-service";
import type {
  StoreProductDetails,
  StoreProductVariant,
} from "@/features/stores/types";
import { useAppSelector } from "@/store/hooks";

const DEFAULT_PRODUCT_IMAGE = "/images/default_product.webp";

export function ProductDetailsView({
  product,
}: {
  product: StoreProductDetails;
}) {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [cart, setCart] = useState<Cart | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const activeVariants = product.variants.filter((variant) => variant.is_active);
  const defaultVariant =
    activeVariants.find((variant) => variant.is_default) ?? activeVariants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id);
  const selectedVariant =
    activeVariants.find((variant) => variant.id === selectedVariantId) ??
    defaultVariant;
  const displayUnit = getMeasurementUnit(product, selectedVariant);
  const quantityStep = product.quantity_step ?? product.minimum_quantity ?? 1;
  const minimumQuantity = product.minimum_quantity ?? quantityStep;
  const [customValue, setCustomValue] = useState(
    product.minimum_quantity ?? product.quantity_step ?? selectedVariant?.value ?? 1,
  );
  const isAuthenticated = Boolean(user) && hasAuthTokens();
  const cartItems = isAuthenticated ? cart?.items ?? [] : [];
  const productCartItems = cartItems.filter((item) => item.product_id === product.id);
  const selectedVariantCartItem = selectedVariant
    ? productCartItems.find((item) => item.variant_id === selectedVariant.id)
    : undefined;
  const customCartItem = productCartItems.find((item) => item.custom_value !== null);
  const productImage = product.uploads?.[0];
  const discountPercent = selectedVariant ? getDiscountPercent(selectedVariant) : 0;
  const storeSlug = product.store?.slug;
  const selectedVariantPendingKey = selectedVariantCartItem?.id ?? selectedVariant?.id;

  useEffect(() => {
    if (!isAuthenticated || !storeSlug) return;

    let isMounted = true;

    getStoreCart(storeSlug)
      .then((nextCart) => {
        if (isMounted) setCart(nextCart);
      })
      .catch(() => {
        if (isMounted) setCart(null);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, storeSlug]);

  const handleAddVariant = async () => {
    if (!selectedVariant) return;
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    setPendingKey(selectedVariant.id);

    try {
      if (!storeSlug) return;
      const nextCart = await addCartItem(storeSlug, {
        product_id: product.id,
        quantity: 1,
        variant_id: selectedVariant.id,
      });
      setCart(nextCart);
    } catch {
    } finally {
      setPendingKey(null);
    }
  };

  const handleAddCustom = async () => {
    if (!storeSlug) return;
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    const key = `${product.id}:custom`;
    setPendingKey(key);

    try {
      const nextCart = await addCartItem(storeSlug, {
        custom_value: customValue,
        product_id: product.id,
        quantity: 1,
      });
      setCart(nextCart);
    } catch {
    } finally {
      setPendingKey(null);
    }
  };

  const handleUpdateCartItem = async (item: CartItem, nextValue: number) => {
    const isCustomItem = item.custom_value !== null;
    const step = item.quantity_step ?? 1;

    if (!isCustomItem && nextValue < 1) {
      await handleDeleteCartItem(item);
      return;
    }

    if (isCustomItem && nextValue < step) return;

    setPendingKey(item.id);

    try {
      const nextCart = await updateCartItem(
        item.id,
        isCustomItem
          ? { custom_value: nextValue, quantity: 1 }
          : { quantity: nextValue },
      );
      setCart(nextCart);
    } catch {
    } finally {
      setPendingKey(null);
    }
  };

  const handleDeleteCartItem = async (item: CartItem) => {
    setPendingKey(item.id);

    try {
      const nextCart = await deleteCartItem(item.id);
      setCart(nextCart);
    } catch {
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-white pb-32 text-gray-900">
      <header className="absolute inset-x-0 top-0 z-20 mx-auto flex h-14 w-full max-w-[640px] items-center justify-between px-3 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm backdrop-blur transition active:scale-95"
        >
          <i className="fa-solid fa-chevron-left text-sm" aria-hidden="true" />
        </button>
        {product.store ? (
          <Link
            href={`/${product.store.slug}/search`}
            aria-label={`Search in ${product.store.name}`}
            className="inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm backdrop-blur transition active:scale-95"
          >
            <i className="fa-solid fa-magnifying-glass text-sm" aria-hidden="true" />
          </Link>
        ) : (
          <span className="size-10" aria-hidden="true" />
        )}
      </header>

      <section>
        <div className="relative h-[340px] w-full overflow-hidden bg-gray-50 sm:h-[360px]">
          <Image
            src={productImage?.url || DEFAULT_PRODUCT_IMAGE}
            alt={productImage?.title || product.name}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
          />
          {discountPercent > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-extrabold text-white shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
        </div>
      </section>

      <section className="px-4 pt-5">
        {product.store && (
          <Link
            href={`/${product.store.slug}`}
            className="inline-flex max-w-full items-center gap-1.5 text-xs font-bold uppercase text-primary"
          >
            <i className="fa-solid fa-store text-[10px]" aria-hidden="true" />
            <span className="truncate">{product.store.name}</span>
          </Link>
        )}
        <h1 className="mt-2 text-2xl font-extrabold leading-tight text-gray-950">
          {product.name}
        </h1>
        {product.brand && (
          <p className="mt-1 text-sm font-semibold text-gray-500">{product.brand}</p>
        )}
        {product.short_description && (
          <p className="mt-3 text-sm font-medium leading-6 text-gray-600">
            {product.short_description}
          </p>
        )}

        {selectedVariant && (
          <div className="mt-4 flex items-end gap-2">
            <span className="text-2xl font-extrabold text-gray-950">
              {formatPrice(selectedVariant.price)}
            </span>
            {discountPercent > 0 && (
              <span className="pb-1 text-sm font-semibold text-gray-400 line-through">
                {formatPrice(selectedVariant.mrp ?? 0)}
              </span>
            )}
          </div>
        )}
      </section>

      {activeVariants.length > 0 && (
        <section className="px-4 pt-6">
          <h2 className="text-sm font-extrabold text-gray-950">Choose option</h2>
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {activeVariants.map((variant) => {
              const selected = variant.id === selectedVariant?.id;

              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`relative flex min-w-[148px] shrink-0 flex-col gap-1 rounded-xl border p-3 text-left transition active:scale-[0.99] ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  {Number(variant.cart_count ?? 0) > 0 && (
                    <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-black leading-none text-white shadow-sm">
                      {variant.cart_count}
                    </span>
                  )}
                  <span className="line-clamp-1 text-sm font-bold text-gray-950">
                    {getVariantMeasurement(variant)}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm">
                    <span className="font-extrabold text-gray-950">
                      {formatPrice(variant.price)}
                    </span>
                    {getDiscountPercent(variant) > 0 && (
                      <span className="text-xs font-semibold text-gray-400 line-through">
                        {formatPrice(variant.mrp ?? 0)}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {product.allow_custom_quantity && (
        <section className="px-4 pt-5">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-gray-950">
                  Custom quantity
                </h2>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  Step {formatMeasuredQuantity(quantityStep, product.measurement_type, displayUnit)}
                </p>
              </div>
              <div className="flex h-10 min-w-[128px] items-center justify-between rounded-xl bg-white ring-1 ring-gray-200">
                <button
                  type="button"
                  onClick={() =>
                    setCustomValue((value) => Math.max(minimumQuantity, value - quantityStep))
                  }
                  disabled={customValue <= minimumQuantity}
                  aria-label="Decrease custom quantity"
                  className="flex h-full w-10 items-center justify-center disabled:text-gray-300"
                >
                  <i className="fa-solid fa-minus text-[10px]" aria-hidden="true" />
                </button>
                <span className="text-sm font-bold">
                  {formatMeasuredQuantity(customValue, product.measurement_type, displayUnit)}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomValue((value) => value + quantityStep)}
                  aria-label="Increase custom quantity"
                  className="flex h-full w-10 items-center justify-center"
                >
                  <i className="fa-solid fa-plus text-[10px]" aria-hidden="true" />
                </button>
              </div>
            </div>
            {storeSlug && (
              <CartAction
                cartItem={customCartItem}
                label={customCartItem ? "Update custom" : "Add custom"}
                pending={pendingKey === (customCartItem?.id ?? `${product.id}:custom`)}
                onAdd={handleAddCustom}
                onUpdate={handleUpdateCartItem}
              />
            )}
          </div>
        </section>
      )}

      {Object.keys(product.specifications ?? {}).length > 0 && (
        <section className="px-4 pt-7">
          <h2 className="text-sm font-extrabold text-gray-950">Specifications</h2>
          <dl className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[120px_1fr] gap-3 px-3 py-3">
                <dt className="text-xs font-bold capitalize text-gray-500">
                  {key.replaceAll("_", " ")}
                </dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {selectedVariant && storeSlug && (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[640px] border-t border-gray-100 bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {getVariantMeasurement(selectedVariant)}
              </p>
              <p className="mt-0.5 flex items-baseline gap-2">
                <span className="text-lg font-black text-gray-950">
                  {formatPrice(selectedVariant.price)}
                </span>
                {discountPercent > 0 && (
                  <span className="text-xs font-bold text-gray-400 line-through">
                    {formatPrice(selectedVariant.mrp ?? 0)}
                  </span>
                )}
              </p>
            </div>
            <div className="w-[164px] shrink-0">
              <CartAction
                cartItem={selectedVariantCartItem}
                label="Add to cart"
                pending={pendingKey === selectedVariantPendingKey}
                onAdd={handleAddVariant}
                onUpdate={handleUpdateCartItem}
                compact
              />
            </div>
          </div>
        </div>
      )}

      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectTo={`/product/${product.slug}`}
      />
    </main>
  );
}

function CartAction({
  cartItem,
  compact = false,
  label,
  onAdd,
  onUpdate,
  pending,
}: {
  cartItem?: CartItem;
  compact?: boolean;
  label: string;
  onAdd: () => void;
  onUpdate: (item: CartItem, nextValue: number) => void;
  pending: boolean;
}) {
  if (cartItem) {
    return (
      <div className={compact ? "" : "mt-3"}>
        <CartItemStepper item={cartItem} onChange={onUpdate} pending={pending} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={pending}
      className={`${compact ? "" : "mt-3"} flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-extrabold uppercase tracking-wide text-white shadow-sm disabled:opacity-70`}
    >
      {pending ? "Adding..." : label}
    </button>
  );
}

function CartItemStepper({
  item,
  onChange,
  pending,
}: {
  item: CartItem;
  onChange: (item: CartItem, nextValue: number) => void;
  pending: boolean;
}) {
  const isCustomItem = item.custom_value !== null;
  const step = item.quantity_step ?? 1;
  const value = isCustomItem ? item.custom_value ?? step : item.quantity;
  const label = isCustomItem
    ? formatMeasuredQuantity(value, item.measurement_type, item.unit)
    : String(item.quantity);

  return (
    <div className="flex h-12 w-full items-center justify-between rounded-xl border border-primary bg-primary text-white shadow-sm">
      <button
        type="button"
        onClick={() => onChange(item, value - step)}
        aria-label="Decrease cart item"
        disabled={pending || (isCustomItem && value <= step)}
        className="flex h-full w-14 items-center justify-center disabled:opacity-70"
      >
        <i className="fa-solid fa-minus text-xs" aria-hidden="true" />
      </button>
      <span className="text-sm font-extrabold">{label}</span>
      <button
        type="button"
        onClick={() => onChange(item, value + step)}
        aria-label="Increase cart item"
        disabled={pending}
        className="flex h-full w-14 items-center justify-center disabled:opacity-70"
      >
        <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
      </button>
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

function getDiscountPercent(variant: StoreProductVariant) {
  if (!variant.mrp || variant.mrp <= variant.price) return 0;
  return Math.round(((variant.mrp - variant.price) / variant.mrp) * 100);
}

function getVariantMeasurement(variant: StoreProductVariant) {
  if (variant.name) return variant.name;
  if (variant.pack_count > 1) {
    return `${variant.display_measurement} x ${variant.pack_count}`;
  }

  return variant.display_measurement;
}

function getMeasurementUnit(
  product: StoreProductDetails,
  variant?: StoreProductVariant,
) {
  if (variant?.unit) return variant.unit;
  if (product.measurement_type === "weight") return "g";
  if (product.measurement_type === "volume") return "ml";
  return "";
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
