"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomSheetModal } from "@/components/modals";
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
import { useAppSelector } from "@/store/hooks";
import type {
  StoreDetails,
  StoreProduct,
  StoreProductListCategory,
  StoreSettings,
  StoreProductVariant,
} from "./types";

const DEFAULT_PRODUCT_IMAGE = "/images/default_product.webp";

export function CategoryProductsView({
  category,
  categorySlug,
  products,
  settings,
  store,
}: {
  category: StoreProductListCategory | null;
  categorySlug: string;
  products: StoreProduct[];
  settings: StoreSettings | null;
  store: StoreDetails;
}) {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [cart, setCart] = useState<Cart | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(
    null,
  );
  const isAuthenticated = Boolean(user) && hasAuthTokens();
  const activeCategoryName =
    category?.display_name || category?.label || category?.name ||
    store.categories.find((storeCategory) => storeCategory.slug === categorySlug)?.name ||
    "Products";
  const relatedCategories =
    category?.related && category.related.length > 0
      ? category.related
      : store.categories.length > 0
        ? store.categories.map((storeCategory) => ({
          ...storeCategory,
          image_url: null,
        }))
        : [
          { id: 1, name: "Popular", slug: "popular", aliases: "", image_url: null, sort_order: 1 },
          { id: 2, name: "Fresh picks", slug: "fresh-picks", aliases: "", image_url: null, sort_order: 2 },
          { id: 3, name: "Essentials", slug: "essentials", aliases: "", image_url: null, sort_order: 3 },
          { id: 4, name: "Deals", slug: "deals", aliases: "", image_url: null, sort_order: 4 },
        ];
  const cartItems = isAuthenticated ? cart?.items ?? [] : [];
  const cartItemCount = isAuthenticated ? cart?.item_count ?? 0 : 0;

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    getStoreCart(store.slug)
      .then((nextCart) => {
        if (isMounted) setCart(nextCart);
      })
      .catch(() => {
        if (isMounted) setCart(null);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, store.slug]);

  const handleAddProduct = async (
    product: StoreProduct,
    variant: StoreProductVariant,
  ) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    setPendingKey(variant.id);

    try {
      const nextCart = await addCartItem(store.slug, {
        product_id: product.id,
        quantity: 1,
        variant_id: variant.id,
      });
      setCart(nextCart);
      setSelectedProduct(null);
    } catch {
    } finally {
      setPendingKey(null);
    }
  };

  const handleAddCustomProduct = async (
    product: StoreProduct,
    customValue: number,
  ) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    const pendingItemKey = `${product.id}:custom`;
    setPendingKey(pendingItemKey);

    try {
      const nextCart = await addCartItem(store.slug, {
        product_id: product.id,
        custom_value: customValue,
        quantity: 1,
      });
      setCart(nextCart);
      setSelectedProduct(null);
    } catch {
    } finally {
      setPendingKey(null);
    }
  };

  const handleUpdateCartItem = async (item: CartItem, nextValue: number) => {
    const isCustomItem = item.custom_value !== null;
    const minimumValue = item.quantity_step ?? 1;

    if (!isCustomItem && nextValue < 1) {
      await handleDeleteCartItem(item);
      return;
    }

    if (isCustomItem && nextValue < minimumValue) return;

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
    <main className="mx-auto flex h-dvh w-full max-w-[640px] flex-col overflow-hidden bg-[#f4f7f8] text-gray-900">
      <header className="z-20 shrink-0 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex h-10 items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition active:scale-95"
          >
            <i className="fa-solid fa-chevron-left text-base" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold leading-tight text-gray-900">
              {activeCategoryName}
            </h1>
            <p className="mt-0.5 truncate text-[11px] font-medium text-gray-500">
              {store.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${store.slug}/search`}
              aria-label={`Search products in ${store.name}`}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition active:scale-95"
            >
              <i className="fa-solid fa-magnifying-glass text-sm" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left Sidebar - Independent Scroll */}
        <aside className="w-[76px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white pb-24 no-scrollbar">
          <nav className="flex flex-col" aria-label="Categories">
            {relatedCategories.map((category) => {
              const isActive = category.slug === categorySlug;

              return (
                <Link
                  key={category.id}
                  href={`/${store.slug}/products/${category.slug}`}
                  className={`flex flex-col items-center justify-start border-r-[4px] px-1 py-2 text-center transition ${isActive
                    ? "border-primary bg-white font-bold text-gray-900"
                    : "border-transparent text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  <div className="relative w-16 h-14 shrink-0 overflow-hidden rounded-lg ">
                    <Image
                      src={category.image_url ?? DEFAULT_PRODUCT_IMAGE}
                      alt={category.image_url ? category.name : ""}
                      fill
                      className="object-cover p-1"
                    />
                  </div>
                  <span className={`line-clamp-2 text-[11px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Right Product Grid - Independent Scroll */}
        <section className="min-w-0 flex-1 overflow-y-auto p-2 pb-20">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {products.map((product) => (
                <CategoryProductCard
                  key={product.id}
                  cartItems={cartItems}
                  onAddProduct={handleAddProduct}
                  onOpenOptions={() => setSelectedProduct(product)}
                  onUpdateCartItem={handleUpdateCartItem}
                  pendingKey={pendingKey}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-white px-4 py-10 text-center shadow-sm">
              <i className="fa-solid fa-box-open text-3xl text-gray-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-gray-900">
                No products found
              </p>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Try another category from the list.
              </p>
            </div>
          )}
        </section>
      </div>

      {cartItemCount > 0 && (
        <CategoryFloatingCartButton
          cartItemCount={cartItemCount}
          cartItems={cartItems}
          storeSlug={store.slug}
        />
      )}

      <BottomSheetModal
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title="Choose option"
        className="max-w-[640px]"
      >
        {selectedProduct && (
          <CategoryOptionPicker
            cartItems={cartItems}
            onAddCustom={handleAddCustomProduct}
            onAddProduct={handleAddProduct}
            onUpdateCartItem={handleUpdateCartItem}
            pendingKey={pendingKey}
            product={selectedProduct}
          />
        )}
      </BottomSheetModal>

      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectTo={`/${store.slug}/products/${categorySlug}`}
      />
    </main>
  );
}

function CategoryFloatingCartButton({
  cartItemCount,
  cartItems,
  storeSlug,
}: {
  cartItemCount: number;
  cartItems: CartItem[];
  storeSlug: string;
}) {
  const previewItems = cartItems.slice(0, 3);
  const itemLabel = cartItemCount === 1 ? "1 item" : `${cartItemCount} items`;
  const previewWidth = previewItems.length > 0
    ? 40 + Math.max(previewItems.length - 1, 0) * 16
    : 40;

  return (
    <Link
      href={`/${storeSlug}/checkout`}
      aria-label={`Go to cart, ${itemLabel}`}
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex h-14 max-w-[220px] items-center gap-2.5 rounded-full bg-primary px-2.5 text-white transition active:scale-[0.98]"
    >
      <div
        className="flex shrink-0 -space-x-6"
        style={{ width: previewWidth }}
      >
        {previewItems.length > 0 ? (
          previewItems.map((item) => (
            <span
              key={item.id}
              className="relative block size-10 overflow-hidden rounded-full border-2 border-white bg-white"
            >
              <Image
                src={getCartItemImage(item)}
                alt=""
                fill
                sizes="40px"
                className="rounded-full object-cover"
              />
            </span>
          ))
        ) : (
          <span className="flex size-10 items-center justify-center rounded-full border-2 border-white bg-white text-primary">
            <i className="fa-solid fa-cart-shopping text-sm" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold leading-tight">
          Go to cart
        </p>
        <p className="mt-0.5 text-xs font-semibold leading-tight text-white/85">
          {itemLabel}
        </p>
      </div>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15">
        <i className="fa-solid fa-chevron-right text-sm" aria-hidden="true" />
      </span>
    </Link>
  );
}

type CartItemWithImage = CartItem & {
  image_url?: string | null;
  product_image?: string | null;
  product_image_url?: string | null;
  thumbnail_url?: string | null;
};

function getCartItemImage(item: CartItem) {
  const imageItem = item as CartItemWithImage;

  return (
    imageItem.product_image_url ??
    imageItem.product_image ??
    imageItem.image_url ??
    imageItem.thumbnail_url ??
    DEFAULT_PRODUCT_IMAGE
  );
}

function CategoryProductCard({
  cartItems,
  onAddProduct,
  onOpenOptions,
  onUpdateCartItem,
  pendingKey,
  product,
}: {
  cartItems: CartItem[];
  onAddProduct: (product: StoreProduct, variant: StoreProductVariant) => void;
  onOpenOptions: () => void;
  onUpdateCartItem: (item: CartItem, nextValue: number) => void;
  pendingKey: string | null;
  product: StoreProduct;
}) {
  const activeVariants = product.variants.filter((variant) => variant.is_active);
  const defaultVariant =
    activeVariants.find((variant) => variant.is_default) ?? activeVariants[0];
  const customCartItem = cartItems.find(
    (item) => item.product_id === product.id && item.custom_value !== null,
  );
  const variantCartItem = defaultVariant
    ? cartItems.find((item) => item.variant_id === defaultVariant.id)
    : undefined;
  const hasOptions = activeVariants.length > 1 || product.allow_custom_quantity;
  const optionCount = activeVariants.length + (product.allow_custom_quantity ? 1 : 0);
  const selectedOptionCartItem =
    customCartItem ??
    cartItems.find((item) => item.product_id === product.id);
  const cartItem = hasOptions ? selectedOptionCartItem : variantCartItem;
  const pendingAddKey = defaultVariant?.id;
  const discountPercent = defaultVariant ? getDiscountPercent(defaultVariant) : 0;
  const productImage = product.uploads?.[0];

  return (
    <article className="relative flex min-w-0 flex-col overflow-hidden rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-gray-200">
      {discountPercent > 0 && (
        <div className="absolute left-0 top-0 z-10 rounded-br-lg rounded-tl-xl bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          {discountPercent}% OFF
        </div>
      )}

      <Link
        href={`/product/${product.slug}`}
        className="relative block h-24 w-full bg-white"
      >
        <Image
          src={productImage?.url || DEFAULT_PRODUCT_IMAGE}
          alt={productImage?.title || product.name}
          fill
          sizes="(max-width: 640px) 42vw, 220px"
          className="object-contain p-1"
        />
      </Link>

      <div className="flex flex-1 flex-col pt-3">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-xs font-semibold leading-snug text-gray-900 transition hover:text-primary"
        >
          {product.name}
        </Link>

        {defaultVariant && (
          <p className="mt-1 text-[11px] font-medium text-gray-500">
            {getVariantMeasurement(defaultVariant)}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between pt-3">
          <div className="flex flex-col leading-tight">
            {defaultVariant && (
              <>
                <span className="text-sm font-bold text-gray-900">
                  {formatPrice(defaultVariant.price)}
                </span>
                {discountPercent > 0 && (
                  <span className="text-[10px] font-medium text-gray-400 line-through">
                    {formatPrice(defaultVariant.mrp ?? 0)}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col items-end">
            {cartItem && hasOptions ? (
              <button
                type="button"
                onClick={onOpenOptions}
                className="inline-flex h-[36px] min-w-[76px] shrink-0 items-center justify-between gap-1.5 rounded-lg border border-primary bg-primary px-2 text-white shadow-sm"
              >
                <i className="fa-solid fa-minus text-[10px]" aria-hidden="true" />
                <span className="min-w-[16px] text-center text-[12px] font-bold leading-none">
                  {getCartItemDisplayLabel(cartItem)}
                </span>
                <i className="fa-solid fa-plus text-[10px]" aria-hidden="true" />
              </button>
            ) : cartItem ? (
              <CartItemStepper
                item={cartItem}
                onChange={onUpdateCartItem}
                pending={pendingKey === cartItem.id}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (hasOptions) {
                    onOpenOptions();
                    return;
                  }
                  if (defaultVariant) {
                    onAddProduct(product, defaultVariant);
                  }
                }}
                disabled={Boolean(!hasOptions && pendingAddKey && pendingKey === pendingAddKey)}
                className="inline-flex h-[36px] min-w-[76px] shrink-0 flex-col items-center justify-center rounded-lg border border-primary bg-white px-2 shadow-sm disabled:opacity-70"
              >
                {!hasOptions && pendingAddKey && pendingKey === pendingAddKey ? (
                  <span className="text-xs font-bold tracking-wide text-primary">...</span>
                ) : (
                  <>
                    <span className="mt-0.5 text-xs font-bold uppercase tracking-wide text-primary leading-none">
                      ADD
                    </span>
                    {hasOptions && (
                      <span className="mt-0.5 text-[9px] font-semibold text-primary/80 leading-tight">
                        {optionCount} options
                      </span>
                    )}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function CategoryOptionPicker({
  cartItems,
  onAddCustom,
  onAddProduct,
  onUpdateCartItem,
  pendingKey,
  product,
}: {
  cartItems: CartItem[];
  onAddCustom: (product: StoreProduct, customValue: number) => void;
  onAddProduct: (product: StoreProduct, variant: StoreProductVariant) => void;
  onUpdateCartItem: (item: CartItem, nextValue: number) => void;
  pendingKey: string | null;
  product: StoreProduct;
}) {
  const activeVariants = product.variants.filter((variant) => variant.is_active);
  const productCartItems = cartItems.filter((item) => item.product_id === product.id);
  const customCartItem = productCartItems.find((item) => item.custom_value !== null);
  const [customValue, setCustomValue] = useState(
    customCartItem?.custom_value ??
    product.minimum_quantity ??
    product.quantity_step ??
    activeVariants[0]?.value ??
    1,
  );
  const quantityStep = product.quantity_step ?? product.minimum_quantity ?? 1;
  const minimumQuantity = product.minimum_quantity ?? quantityStep;
  const displayUnit = getMeasurementUnit(product, activeVariants[0]);

  return (
    <div className="px-4 pb-5 pt-4">
      <div className="mb-4">
        <h2 className="line-clamp-2 text-base font-semibold text-gray-900">
          {product.name}
        </h2>
      </div>

      <div className="mt-2 space-y-2">
        {activeVariants.map((variant) => {
          const cartItem = productCartItems.find(
            (item) => item.variant_id === variant.id,
          );
          const discountPercent = getDiscountPercent(variant);
          const hasDiscount = discountPercent > 0;

          return (
            <div
              key={variant.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {getVariantMeasurement(variant)}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(variant.price)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-xs font-medium text-gray-400 line-through">
                        {formatPrice(variant.mrp ?? 0)}
                      </span>
                      <span className="rounded bg-blue-600 px-1 py-0.5 text-[9px] font-bold text-white shadow-sm">
                        {discountPercent}% OFF
                      </span>
                    </>
                  )}
                </p>
              </div>

              {cartItem ? (
                <CartItemStepper
                  item={cartItem}
                  onChange={onUpdateCartItem}
                  pending={pendingKey === cartItem.id}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onAddProduct(product, variant)}
                  disabled={pendingKey === variant.id}
                  className="inline-flex h-[36px] min-w-[76px] items-center justify-center rounded-lg border border-primary bg-white px-3 text-xs font-bold uppercase tracking-wide text-primary shadow-sm disabled:opacity-70"
                >
                  {pendingKey === variant.id ? "..." : "ADD"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {product.allow_custom_quantity && (
        <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Custom quantity</p>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Step {formatMeasuredQuantity(quantityStep, product.measurement_type, displayUnit)}
              </p>
            </div>
            <div className="flex h-[36px] min-w-[112px] items-center justify-between rounded-lg bg-white text-gray-900 ring-1 ring-gray-100">
              <button
                type="button"
                onClick={() =>
                  setCustomValue((value) => Math.max(minimumQuantity, value - quantityStep))
                }
                aria-label="Decrease custom quantity"
                disabled={customValue <= minimumQuantity}
                className="flex h-full w-8 items-center justify-center disabled:text-gray-300"
              >
                <i className="fa-solid fa-minus text-[10px]" aria-hidden="true" />
              </button>
              <span className="px-1 text-center text-xs font-semibold">
                {formatMeasuredQuantity(customValue, product.measurement_type, displayUnit)}
              </span>
              <button
                type="button"
                onClick={() => setCustomValue((value) => value + quantityStep)}
                aria-label="Increase custom quantity"
                className="flex h-full w-8 items-center justify-center"
              >
                <i className="fa-solid fa-plus text-[10px]" aria-hidden="true" />
              </button>
            </div>
          </div>

          {customCartItem ? (
            <button
              type="button"
              onClick={() => onUpdateCartItem(customCartItem, customValue)}
              disabled={pendingKey === customCartItem.id}
              className="mt-3 h-10 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-70"
            >
              Update custom
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAddCustom(product, customValue)}
              disabled={pendingKey === `${product.id}:custom`}
              className="mt-3 h-10 w-full rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-70"
            >
              {pendingKey === `${product.id}:custom` ? "Adding..." : "Add custom"}
            </button>
          )}
        </div>
      )}
    </div>
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
    <div className="flex h-[36px] min-w-[76px] shrink-0 items-center justify-between rounded-lg border border-primary bg-primary text-white shadow-sm">
      <button
        type="button"
        onClick={() => onChange(item, value - step)}
        aria-label="Decrease cart item"
        disabled={pending || (isCustomItem && value <= step)}
        className="flex h-full w-8 items-center justify-center disabled:opacity-70"
      >
        <i className="fa-solid fa-minus text-[10px]" aria-hidden="true" />
      </button>
      <span className="min-w-[16px] px-0.5 text-center text-[12px] font-bold leading-none">
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(item, value + step)}
        aria-label="Increase cart item"
        disabled={pending}
        className="flex h-full w-8 items-center justify-center disabled:opacity-70"
      >
        <i className="fa-solid fa-plus text-[10px]" aria-hidden="true" />
      </button>
    </div>
  );
}

function getDiscountPercent(variant: StoreProductVariant) {
  if (!variant.mrp || variant.mrp <= variant.price) return 0;
  return Math.round(((variant.mrp - variant.price) / variant.mrp) * 100);
}

function getCartItemDisplayLabel(item: CartItem) {
  if (item.custom_value !== null) {
    return formatMeasuredQuantity(
      item.custom_value,
      item.measurement_type,
      item.unit,
    );
  }

  return String(item.quantity);
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(price);
}

function getVariantMeasurement(variant: StoreProductVariant) {
  if (variant.name) return variant.name;

  if (variant.pack_count > 1) {
    return `${variant.display_measurement} x ${variant.pack_count}`;
  }

  return variant.display_measurement;
}

function getMeasurementUnit(
  product: StoreProduct,
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
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}
