"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CartItem } from "@/features/cart/cart-service";
import type { StoreSettings } from "@/features/stores/types";

const DEFAULT_PRODUCT_IMAGE = "/images/default_product.webp";

const navItems = [
  {
    label: "Home",
    icon: "fa-house",
    href: () => "/",
    isActive: (pathname: string) => pathname === "/",
  },
  {
    label: "Store",
    icon: "fa-store",
    href: (storeSlug: string) => `/${storeSlug}`,
    isActive: (pathname: string, storeSlug: string) =>
      pathname === `/${storeSlug}` || pathname.startsWith(`/${storeSlug}/products/`),
  },
  {
    label: "Search",
    icon: "fa-magnifying-glass",
    href: (storeSlug: string) => `/${storeSlug}/search`,
    isActive: (pathname: string, storeSlug: string) =>
      pathname === `/${storeSlug}/search`,
  },
  {
    label: "Orders",
    icon: "fa-clock-rotate-left",
    href: (storeSlug: string) => `/${storeSlug}/orders`,
    isActive: (pathname: string, storeSlug: string) =>
      pathname === `/${storeSlug}/orders`,
  },
];

export function StoreBottomNav({
  cartItemCount,
  cartItems = [],
  cartSubtotal,
  showFloatingCart = false,
  storeSettings,
  storeSlug,
}: {
  cartItemCount?: number;
  cartItems?: CartItem[];
  cartSubtotal?: number;
  showFloatingCart?: boolean;
  storeSettings?: StoreSettings | null;
  storeSlug: string;
}) {
  const pathname = usePathname();
  const freeDeliveryMessage = getFreeDeliveryMessage(
    cartSubtotal,
    storeSettings,
  );

  return (
    <>
      {showFloatingCart && cartItemCount !== undefined && cartItemCount > 0 && (
        <FloatingCartButton
          cartItemCount={cartItemCount}
          cartItems={cartItems}
          storeSlug={storeSlug}
        />
      )}

      <nav
        aria-label="Store navigation"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[640px] border-t border-gray-100 bg-white"
      >
        {freeDeliveryMessage && (
          <div className="border-b border-emerald-100 bg-emerald-50 px-3 py-2 text-center text-[11px] font-semibold text-emerald-700">
            {freeDeliveryMessage}
          </div>
        )}
        <div className="flex h-[72px] items-center gap-2 px-3 pb-3 pt-2">
          {navItems.slice(0, 1).map((item) => {
            const href = item.href(storeSlug);
            const active = item.isActive(pathname, storeSlug);

            return (
              <Link
                key={item.label}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-full bg-gray-100 transition-colors ${active ? "text-primary" : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                <div className="relative flex items-center justify-center">
                  <i className={`fa-solid ${item.icon} text-lg`} aria-hidden="true" />
                </div>
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
          <div className="grid h-14 min-w-0 flex-1 grid-cols-3 rounded-full bg-gray-100 p-1">
            {navItems.slice(1).map((item) => {
              const href = item.href(storeSlug);
              const active = item.isActive(pathname, storeSlug);

              return (
                <Link
                  key={item.label}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1 rounded-full transition-colors ${active ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  <i className={`fa-solid ${item.icon} text-base`} aria-hidden="true" />
                  <span className="text-[10px] font-medium leading-none">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

function FloatingCartButton({
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
      className="floating-cart-button fixed inset-x-4 bottom-[76px] z-50 mx-auto flex h-14 max-w-[220px] items-center gap-2.5 rounded-full bg-primary px-2.5 text-white transition active:scale-[0.98]"
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

function getFreeDeliveryMessage(
  cartSubtotal?: number,
  settings?: StoreSettings | null,
) {
  if (!settings || cartSubtotal === undefined || cartSubtotal <= 0) return null;

  if (
    settings.is_express_delivery_enabled &&
    cartSubtotal < settings.express_min_order_amount
  ) {
    return `Add ${formatPrice(settings.express_min_order_amount - cartSubtotal)} more to unlock FREE EXPRESS DELIVERY`;
  }

  if (
    settings.is_scheduled_delivery_enabled &&
    cartSubtotal < settings.scheduled_min_order_amount
  ) {
    return `Add ${formatPrice(settings.scheduled_min_order_amount - cartSubtotal)} more to unlock FREE SCHEDULED DELIVERY`;
  }

  return null;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(price);
}
