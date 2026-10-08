"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BottomSheetModal } from "@/components/modals";
import { StoreBottomNav } from "@/components/store-bottom-nav";
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
import {
  getSavedStores,
  saveStore,
  unsaveStore,
} from "@/features/stores/stores-service";
import { useAppSelector } from "@/store/hooks";
import type {
  StoreDayHours,
  StoreCategoryGrid,
  StoreDeliveryStatus,
  StoreDetails,
  StoreProduct,
  StoreProductVariant,
} from "./types";

const DEFAULT_PRODUCT_IMAGE = "/images/default_product.webp";

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const SEARCH_PLACEHOLDERS = ["Rice", "Mustard Oil", "Atta"];

export function StoreDetailsView({
  products,
  store,
}: {
  products: StoreProduct[];
  store: StoreDetails;
}) {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [isSaved, setIsSaved] = useState(false);
  const [isSavePending, setIsSavePending] = useState(false);
  const [isHoursOpen, setIsHoursOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(
    null,
  );
  const isAuthenticated = Boolean(user) && hasAuthTokens();
  const orderedDays = useMemo(() => getDaysFromToday(), []);
  const address = [
    store.address,
    store.locality,
    store.city.name,
    store.city.state.name,
    store.pincode,
  ]
    .filter(Boolean)
    .join(", ");
  const cartItems = isAuthenticated ? cart?.items ?? [] : [];
  const cartItemCount = isAuthenticated ? cart?.item_count ?? 0 : 0;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

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

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    getSavedStores()
      .then((response) => {
        if (!isMounted) return;
        setIsSaved(
          response.results.some((savedStore) => savedStore.store.slug === store.slug),
        );
      })
      .catch(() => {
        if (isMounted) setIsSaved(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, store.slug]);

  const handleShare = async () => {
    const storeUrl = window.location.href;
    const shareText = `Order from ${store.name} online through Storedel. ${storeUrl}`;
    const shareData = {
      title: store.name,
      text: shareText,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard?.writeText(shareText);
  };

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    const nextSaved = !isSaved;
    setIsSavePending(true);
    setIsSaved(nextSaved);

    try {
      await (nextSaved ? saveStore(store.slug) : unsaveStore(store.slug));
    } catch {
      setIsSaved(!nextSaved);
    } finally {
      setIsSavePending(false);
    }
  };

  const handleOpenProductOptions = (product: StoreProduct) => {
    if (product.allow_custom_quantity || product.variants.length > 1) {
      setSelectedProduct(product);
      return;
    }

    const defaultVariant =
      product.variants.find((variant) => variant.is_active && variant.is_default) ??
      product.variants.find((variant) => variant.is_active);

    if (defaultVariant) {
      void handleAddVariant(product, defaultVariant);
    }
  };

  const handleAddVariant = async (
    product: StoreProduct,
    variant: StoreProductVariant,
  ) => {
    await handleAddCartItem({
      key: variant.id,
      payload: {
        product_id: product.id,
        quantity: 1,
        variant_id: variant.id,
      },
    });
  };

  const handleAddCustomQuantity = async (
    product: StoreProduct,
    customValue: number,
  ) => {
    await handleAddCartItem({
      key: `${product.id}:custom`,
      payload: {
        product_id: product.id,
        custom_value: customValue,
        quantity: 1,
      },
    });
  };

  const handleAddCartItem = async ({
    key,
    payload,
  }: {
    key: string;
    payload: Parameters<typeof addCartItem>[1];
  }) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    setPendingKey(key);

    try {
      const nextCart = await addCartItem(store.slug, payload);
      setCart(nextCart);
      setSelectedProduct(null);
    } catch {
    } finally {
      setPendingKey(null);
    }
  };

  const handleUpdateCartItem = async (
    item: CartItem,
    nextValue: number,
  ) => {
    const isCustomItem = item.custom_value !== null;
    const nextQuantity = isCustomItem ? item.quantity : nextValue;
    const nextCustomValue = isCustomItem ? nextValue : item.custom_value;

    if (!isCustomItem && nextQuantity < 1) {
      await handleDeleteCartItem(item);
      return;
    }

    const minimumValue = item.quantity_step ?? 1;
    if (isCustomItem && nextCustomValue !== null && nextCustomValue < minimumValue) {
      return;
    }

    setPendingKey(item.id);

    const payload = {
      ...(isCustomItem
        ? { custom_value: nextCustomValue ?? undefined, quantity: 1 }
        : {}),
      ...(!isCustomItem ? { quantity: nextQuantity } : {}),
    };

    try {
      const nextCart = await updateCartItem(item.id, payload);
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
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-white text-gray-900 pb-28">
      <StoreCoverImage
        coverImage={store.cover_image}
        isSaved={isAuthenticated && isSaved}
        isSavePending={isSavePending}
        storeName={store.name}
        onBack={() => router.push("/stores")}
        onSave={handleToggleSave}
        onShare={handleShare}
      />

      {/* Floating Compact Store Info Card */}
      <StoreOverviewSection
        address={address}
        currentStatus={store.current_status}
        deliveryStatus={store.delivery_status}
        name={store.name}
        onOpenHours={() => setIsHoursOpen(true)}
        storeSlug={store.slug}
        title={store.title}
      />

      <CategoryGrid categories={store.category_grid ?? []} storeSlug={store.slug} />

      <section className="mt-8 px-3">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold text-gray-900">Frequently Bought</h2>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                cartItems={cartItems}
                pendingKey={pendingKey}
                onAddVariant={handleAddVariant}
                onUpdateCartItem={handleUpdateCartItem}
                onOpenOptions={() => handleOpenProductOptions(product)}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="mt-2 rounded-2xl bg-gray-50 px-4 py-12 text-center text-sm font-medium text-gray-500 border border-gray-100">
            <i className="fa-solid fa-box-open mb-3 text-4xl text-gray-300" />
            <p className="text-base font-bold text-gray-900">No products available</p>
            <p className="mt-1 text-xs text-gray-500">Check back later for new arrivals.</p>
          </div>
        )}

        <BusinessInfoCard address={address} store={store} />
      </section>

      <BottomSheetModal
        open={isHoursOpen}
        onClose={() => setIsHoursOpen(false)}
        title="Store Information"
        className="max-w-[640px]"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsHoursOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-0 z-20 inline-flex size-8 -translate-y-12 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 transition active:scale-95"
          >
            <i className="fa-solid fa-xmark text-sm" aria-hidden="true" />
          </button>
          <div className="px-5 pb-6 pt-2">
            <h3 className="mb-4 text-base font-extrabold text-gray-900">Opening Hours</h3>
            <div className="space-y-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {orderedDays.map((day, idx) => (
                <div key={day} className={`px-4 py-3 ${idx !== orderedDays.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <OpeningHoursRow day={day} hours={store.store_hours[day]} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </BottomSheetModal>

      <StoreBottomNav
        cartItemCount={cartItemCount}
        cartItems={cartItems}
        showFloatingCart
        storeSlug={store.slug}
      />

      <BottomSheetModal
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title="Choose option"
        className="max-w-[640px]"
      >
        {selectedProduct && (
          <VariantPicker
            cartItems={cartItems}
            pendingKey={pendingKey}
            onAddCustom={handleAddCustomQuantity}
            onAddVariant={handleAddVariant}
            onUpdateCartItem={handleUpdateCartItem}
            product={selectedProduct}
          />
        )}
      </BottomSheetModal>

      <AuthModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        redirectTo={`/${store.slug}`}
      />
    </main>
  );
}

function StoreCoverImage({
  coverImage,
  isSaved,
  isSavePending,
  onBack,
  onSave,
  onShare,
  storeName,
}: {
  coverImage: string | null;
  isSaved: boolean;
  isSavePending: boolean;
  onBack: () => void;
  onSave: () => void;
  onShare: () => void;
  storeName: string;
}) {
  return (
    <section className="relative h-[220px] w-full overflow-hidden bg-gray-200">
      {coverImage ? (
        <Image
          src={coverImage}
          alt={storeName}
          fill
          priority
          sizes="640px"
          className="object-cover object-center"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gray-100 text-6xl text-gray-300">
          <i className="fa-solid fa-store" aria-hidden="true" />
        </div>
      )}

      {/* Soft Top Gradient for visibility */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

      {/* Top Controls with White Frosted Blur */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow-sm backdrop-blur-md transition active:scale-95"
        >
          <i className="fa-solid fa-chevron-left text-sm" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            aria-label="Share store"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow-sm backdrop-blur-md transition active:scale-95"
          >
            <i className="fa-solid fa-share-nodes text-[13px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSavePending}
            aria-label={isSaved ? "Remove saved store" : "Save store"}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow-sm backdrop-blur-md transition disabled:opacity-70 active:scale-95"
          >
            <i
              className={`${isSaved ? "fa-solid text-primary" : "fa-regular"} fa-bookmark text-[13px]`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </section>
  );
}

function StoreOverviewSection({
  address,
  currentStatus,
  deliveryStatus,
  name,
  onOpenHours,
  storeSlug,
  title,
}: {
  address: string;
  currentStatus?: StoreDetails["current_status"];
  deliveryStatus?: StoreDeliveryStatus;
  name: string;
  onOpenHours: () => void;
  storeSlug: string;
  title?: string;
}) {
  const [searchPlaceholderIndex, setSearchPlaceholderIndex] = useState(0);
  const statusText = currentStatus?.text ?? "Hours";
  const nextText = currentStatus?.next;
  const pickupAvailability = getDeliveryStatusAvailability(
    deliveryStatus?.pickup,
  );
  const expressAvailability = getDeliveryStatusAvailability(
    deliveryStatus?.express_delivery,
  );
  const scheduledDelivery = deliveryStatus?.scheduled_delivery;
  const scheduledText = scheduledDelivery?.next_delivery_by
    ? `Delivery by ${formatStatusDateTime(scheduledDelivery.next_delivery_by)}`
    : "Delivery unavailable";
  const searchTerm = SEARCH_PLACEHOLDERS[searchPlaceholderIndex];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSearchPlaceholderIndex((index) => (index + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="relative z-10 mx-3 -mt-12 rounded-[20px] bg-white p-3.5 shadow-sm border border-gray-100/80">
      <div className="min-w-0">
        <h1 className="truncate text-[22px] font-extrabold leading-tight text-gray-900">{name}</h1>
        {title && (
          <p className="mt-0.5 text-[11px] font-bold text-primary uppercase">
            {title}
          </p>
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-500">
        <i className="fa-solid fa-location-dot text-[10px] text-gray-400" aria-hidden="true" />
        <span className="line-clamp-1">{address}</span>
      </div>

      <button
        type="button"
        onClick={onOpenHours}
        className="hidden"
      >
        <i className="fa-regular fa-clock text-[10px] text-gray-400" aria-hidden="true" />
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="font-bold">
            {statusText}
          </span>
          {nextText && (
            <>
              <span className="text-gray-300">•</span>
              <span className="font-medium text-gray-500">{nextText}</span>
            </>
          )}
          <i className="fa-solid fa-chevron-right ml-0.5 text-[9px] text-gray-400" aria-hidden="true"></i>
        </div>
      </button>

      {/* Compact Delivery Options Tabs */}
      {/* <div className="mt-4 grid grid-cols-3 gap-2">
        {deliveryStatus?.pickup?.is_enabled && (
        <div className="rounded-[16px] bg-gray-100 p-2 text-left">
          <div className="mb-2 flex items-start justify-between gap-1">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/80 text-primary shadow-sm">
              <i className="fa-solid fa-person-walking text-sm" aria-hidden="true" />
            </span>
            <i className="fa-solid fa-chevron-right mt-2 text-[10px] text-gray-400" aria-hidden="true" />
          </div>
          <span className="block text-[10px] font-extrabold leading-4 text-gray-900">Store Pickup</span>
          <span className={`mt-1 block text-[9px] font-medium leading-tight ${pickupAvailability.available ? "text-primary" : "text-amber-600"}`}>
            {pickupAvailability.text}
          </span>
        </div>
        )}
        {deliveryStatus?.express_delivery?.is_enabled && (
        <div className="rounded-[16px] bg-gray-100 p-2 text-left">
          <div className="mb-2 flex items-start justify-between gap-1">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/80 text-primary shadow-sm">
              <i className="fa-solid fa-motorcycle text-sm" aria-hidden="true" />
            </span>
            <i className="fa-solid fa-chevron-right mt-2 text-[10px] text-gray-400" aria-hidden="true" />
          </div>
          <span className="block text-[10px] font-extrabold leading-4 text-gray-900">Express Delivery</span>
          <span className={`mt-1 block text-[9px] font-medium leading-tight ${expressAvailability.available ? "text-primary" : "text-amber-600"}`}>
            {expressAvailability.text}
          </span>
        </div>
        )}
        {scheduledDelivery?.is_enabled && (
        <div className="rounded-[16px] bg-gray-100 p-2 text-left">
          <div className="mb-2 flex items-start justify-between gap-1">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/80 text-primary shadow-sm">
              <i className="fa-solid fa-calendar-check text-sm" aria-hidden="true" />
            </span>
            <i className="fa-solid fa-chevron-right mt-2 text-[10px] text-gray-400" aria-hidden="true" />
          </div>
          <span className="block text-[10px] font-extrabold leading-4 text-gray-900">Scheduled Delivery</span>
          <span className="mt-1 block text-[9px] font-medium leading-tight text-primary">
            {scheduledText}
          </span>
        </div>
        )}
      </div> */}

      {/* Compact Delivery Options Tabs - Horizontal Scroll */}
      <div className="mt-4 flex w-full items-center gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {deliveryStatus?.pickup?.is_enabled && (
          <div className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-[14px] border border-gray-100 bg-gray-50/80 p-1.5 pr-4 transition active:scale-95">
            <FulfillmentImageIcon src="/images/pickup.png" alt="Pickup" />
            <div className="flex flex-col justify-center">
              <span className="block text-[11px] font-extrabold leading-tight text-gray-900">
                Store Pickup
              </span>
              <span className={`mt-0.5 block text-[9px] font-bold leading-tight ${pickupAvailability.available ? "text-primary" : "text-amber-600"}`}>
                {pickupAvailability.text}
              </span>
            </div>
          </div>
        )}

        {deliveryStatus?.express_delivery?.is_enabled && (
          <div className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-[14px] border border-gray-100 bg-gray-50/80 p-1.5 pr-4 transition active:scale-95">
            <FulfillmentImageIcon src="/images/express-delivery.png" alt="Express delivery" />
            <div className="flex flex-col justify-center">
              <span className="block text-[11px] font-extrabold leading-tight text-gray-900">
                Express Delivery
              </span>
              <span className={`mt-0.5 block text-[9px] font-bold leading-tight ${expressAvailability.available ? "text-primary" : "text-amber-600"}`}>
                {expressAvailability.text}
              </span>
            </div>
          </div>
        )}

        {scheduledDelivery?.is_enabled && (
          <div className="flex shrink-0 cursor-pointer items-center gap-2.5 rounded-[14px] border border-gray-100 bg-gray-50/80 p-1.5 pr-4 transition active:scale-95">
            <FulfillmentImageIcon src="/images/scheduled-delivery.png" alt="Scheduled delivery" />
            <div className="flex flex-col justify-center">
              <span className="block text-[11px] font-extrabold leading-tight text-gray-900">
                Scheduled Delivery
              </span>
              <span className="mt-0.5 block text-[9px] font-bold leading-tight text-primary">
                {scheduledText}
              </span>
            </div>
          </div>
        )}

      </div>

      <Link
        href={`/${storeSlug}/search`}
        className="mt-2.5 flex h-[52px] items-center rounded-[14px] bg-[#f4efe7] px-3.5 transition active:scale-[0.98]"
        aria-label={`Search products in ${name}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <i className="fa-solid fa-magnifying-glass text-sm text-gray-400" aria-hidden="true" />
          <span className="relative h-5 min-w-0 overflow-hidden text-sm font-medium text-gray-500">
            <span
              key={searchPlaceholderIndex}
              className="block animate-[slide-search-placeholder_3200ms_ease-in-out]"
            >
              Search &quot;{searchTerm}&quot; in {name}...
            </span>
          </span>
        </div>
      </Link>
    </section>
  );
}

function FulfillmentImageIcon({ alt, src }: { alt: string; src: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white shadow-sm">
      <Image
        src={src}
        alt={alt}
        width={24}
        height={24}
        className="size-6 object-contain"
      />
    </span>
  );
}

function BusinessInfoCard({
  address,
  store,
}: {
  address: string;
  store: StoreDetails;
}) {
  const phoneNumber = store.phone || store.whatsapp;
  const displayPhoneNumber = formatDisplayPhone(phoneNumber);
  const dialablePhone = getDialablePhone(phoneNumber);
  const whatsappPhone = getDialablePhone(store.whatsapp || store.phone);
  const directionsHref =
    store.latitude && store.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${store.latitude},${store.longitude}`,
        )}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const categoryNames = store.categories
    .slice(0, 4)
    .map((category) => category.name)
    .filter(Boolean);
  const description = categoryNames.length
    ? `${store.name} offers ${categoryNames.join(", ")} and daily essentials through Storedel.`
    : `${store.name} is available on Storedel for nearby shopping and local order fulfillment.`;

  return (
    <>
      <section className="mb-6 mt-8 rounded-[20px] border border-gray-100/80 bg-gray-50 p-3.5 shadow-xs">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-gray-100/60 bg-gray-50 text-gray-400 shadow-sm">
            <i className="fa-solid fa-store text-sm" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-[15px] font-black leading-tight text-gray-900">
              {store.name}
            </h2>
            {store.title && (
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                {store.title}
              </p>
            )}
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-500">
              {description}
            </p>
          </div>
        </div>

        {/* Horizontal Widget CTAs */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <BusinessCta
            disabled={!dialablePhone}
            href={dialablePhone ? `tel:${dialablePhone}` : "#"}
            icon="fa-phone"
            label="Call"
            color="blue"
          />
          <BusinessCta
            disabled={!whatsappPhone}
            href={whatsappPhone ? `https://wa.me/${whatsappPhone}` : "#"}
            icon="fa-brands fa-whatsapp"
            label="Chat"
            color="emerald"
          />
          <BusinessCta
            href={directionsHref}
            icon="fa-diamond-turn-right"
            label="Map"
            color="purple"
          />
        </div>

        {/* Compact Info Card */}
        <div className="mt-3 rounded-[14px] border border-gray-100 bg-gray-50/50 p-2.5">
          <div className="flex items-start gap-2">
            <i className="fa-solid fa-location-dot mt-0.5 shrink-0 text-[10px] text-gray-400" aria-hidden="true" />
            <p className="text-[11px] font-medium leading-snug text-gray-600">
              {address || "Address unavailable"}
            </p>
          </div>

          {(phoneNumber || store.email) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-200/60 pt-2">
              {phoneNumber && (
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-phone text-[11px] text-gray-400" aria-hidden="true" />
                  <span className="text-[12px] font-semibold text-gray-700">{displayPhoneNumber}</span>
                </div>
              )}
              {store.email && (
                <div className="flex min-w-0 items-center gap-1.5">
                  <i className="fa-solid fa-envelope text-[12px] text-gray-400" aria-hidden="true" />
                  <span className="truncate text-[12px] font-semibold text-gray-700">{store.email}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Links */}
        {/* <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">
          <Link href="/terms" className="transition hover:text-gray-800">
            Terms
          </Link>
          <span className="text-gray-200">•</span>
          <Link href="/privacy" className="transition hover:text-gray-800">
            Privacy
          </Link>
          <span className="text-gray-200">•</span>
          <Link href="/cancellation-policy" className="transition hover:text-gray-800">
            Cancellation
          </Link>
        </div> */}
      </section>
    </>
  );
}


function BusinessCta({
  disabled,
  href,
  icon,
  label,
  color = "gray"
}: {
  disabled?: boolean;
  href: string;
  icon: string;
  label: string;
  color?: "blue" | "emerald" | "purple" | "gray";
}) {
  const colorStyles = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100/50",
    purple: "text-purple-600 bg-purple-100/70 border-purple-100/50",
    gray: "text-gray-600 bg-gray-50 border-gray-200",
  };

  const Wrapper = disabled ? "div" : Link;

  return (
    <Wrapper
      href={href}
      className={`flex h-9 items-center justify-center gap-1.5 rounded-[12px] border ${colorStyles[color]} transition-all ${disabled ? "opacity-50 grayscale" : "cursor-pointer hover:shadow-sm active:scale-95"
        }`}
    >
      <i className={`fa-solid ${icon} text-[11px]`} aria-hidden="true" />
      <span className="text-[10px] font-extrabold">
        {label}
      </span>
    </Wrapper>
  );
}

function getDeliveryStatusAvailability(
  status?: {
    is_enabled: boolean;
    is_available: boolean;
    next_time: string | null;
  },
) {
  if (status?.is_available) {
    return {
      available: true,
      text: "Available now",
    };
  }

  return {
    available: false,
    text: status?.next_time
      ? `Available from ${formatStatusDateTime(status.next_time)}`
      : "Available from later",
  };
}

function getDialablePhone(value?: string | null) {
  if (!value) return "";

  const digits = value.replace(/\D/g, "");
  return digits;
}

function formatDisplayPhone(value?: string | null) {
  if (!value) return "";

  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return trimmed
    .replace(/^\+91[\s-]*/, "")
    .replace(/^91[\s-]+/, "");
}

function formatStatusDateTime(value: string) {
  const date = new Date(value);
  const today = startOfDay(new Date());
  const targetDay = startOfDay(date);
  const dayOffset = Math.round(
    (targetDay.getTime() - today.getTime()) / 86_400_000,
  );
  const time = formatStatusTime(date);

  if (dayOffset === 0) return time;
  if (dayOffset === 1) return `Tomorrow ${time}`;

  const weekday = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
  }).format(date);

  return `${weekday} ${time}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatStatusTime(date: Date) {
  const minutes = date.getMinutes();

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    hour12: true,
    ...(minutes === 0 ? {} : { minute: "2-digit" }),
  })
    .format(date)
    .replace(/\s/g, "")
    .toUpperCase();
}

function CategoryGrid({
  categories,
  storeSlug,
}: {
  categories: StoreCategoryGrid[];
  storeSlug: string;
}) {
  if (categories.length === 0) return null;

  return (
    <section className="mt-6 px-3">
      {categories.map((category) => (
        <div key={category.id} className="mb-6 last:mb-0">
          <h2 className="mb-3 text-[18px] font-extrabold text-gray-900">
            {category.name}
          </h2>
          <div className="grid grid-cols-4 gap-x-2 gap-y-3">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/${storeSlug}/products/${child.slug}`}
                className="group flex flex-col items-center gap-1.5 transition active:scale-95"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-[18px] bg-gray-50 transition-colors group-hover:bg-gray-100/80">
                  <Image
                    src={child.image_url || DEFAULT_PRODUCT_IMAGE}
                    alt={child.name}
                    fill
                    sizes="(max-width: 640px) 22vw, 140px"
                    className="object-contain p-2.5 drop-shadow-sm"
                  />
                </div>
                <span className="line-clamp-2 text-center text-[12px] font-semibold leading-tight text-gray-700">
                  {child.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function ProductCard({
  cartItems,
  onAddVariant,
  onUpdateCartItem,
  onOpenOptions,
  pendingKey,
  product,
}: {
  cartItems: CartItem[];
  onAddVariant: (product: StoreProduct, variant: StoreProductVariant) => void;
  onUpdateCartItem: (item: CartItem, nextValue: number) => void;
  onOpenOptions: () => void;
  pendingKey: string | null;
  product: StoreProduct;
}) {
  const activeVariants = product.variants.filter((variant) => variant.is_active);
  const defaultVariant =
    activeVariants.find((variant) => variant.is_default) ?? activeVariants[0];
  const productCartItems = cartItems.filter((item) => item.product_id === product.id);
  const defaultVariantCartItem = defaultVariant
    ? productCartItems.find((item) => item.variant_id === defaultVariant.id)
    : undefined;
  const customCartItem = productCartItems.find((item) => item.custom_value !== null);
  const singleCartItem =
    productCartItems.length === 1 ? productCartItems[0] : defaultVariantCartItem ?? customCartItem;

  const discountPercent = defaultVariant ? getDiscountPercent(defaultVariant) : 0;
  const productImage = product.uploads?.[0];
  const hasOptions = activeVariants.length > 1 || product.allow_custom_quantity;
  const optionCount = activeVariants.length + (product.allow_custom_quantity ? 1 : 0);
  const pendingAddKey = defaultVariant?.id;

  return (
    <article className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white p-2.5 shadow-sm border border-gray-100/60">
      {discountPercent > 0 && (
        <div className="absolute left-0 top-0 z-10 rounded-br-xl rounded-tl-2xl bg-blue-600 px-2 py-1 text-[9px] font-black text-white shadow-sm">
          {discountPercent}% OFF
        </div>
      )}

      <Link
        href={`/product/${product.slug}`}
        className="relative block h-32 w-full overflow-hidden rounded-[14px] bg-white"
      >
        <Image
          src={productImage?.url || DEFAULT_PRODUCT_IMAGE}
          alt={productImage?.title || product.name}
          fill
          sizes="(max-width: 640px) 42vw, 220px"
          className="rounded-[14px] object-contain p-1"
        />
      </Link>

      <div className="flex flex-1 flex-col pt-2.5">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-[13px] font-semibold leading-snug text-gray-900 transition hover:text-primary"
        >
          {product.name}
        </Link>

        {defaultVariant && (
          <p className="mt-1 text-[11px] font-medium text-gray-500">
            {getVariantMeasurement(defaultVariant)}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex flex-col leading-tight">
            {defaultVariant && (
              <>
                <span className="text-[15px] font-bold text-gray-900">
                  {formatPrice(defaultVariant.price)}
                </span>
                {discountPercent > 0 && (
                  <span className="text-[10px] font-semibold text-gray-400 line-through">
                    {formatPrice(defaultVariant.mrp ?? 0)}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col items-end">
            {singleCartItem && hasOptions ? (
              <button
                type="button"
                onClick={onOpenOptions}
                className="inline-flex h-[36px] min-w-[76px] shrink-0 items-center justify-between rounded-xl border border-primary bg-primary px-2.5 text-white shadow-sm transition active:scale-95"
              >
                <i className="fa-solid fa-minus text-[10px]" aria-hidden="true" />
                <span className="min-w-[16px] text-center text-[12px] font-bold leading-none">
                  {getCartItemDisplayLabel(singleCartItem)}
                </span>
                <i className="fa-solid fa-plus text-[10px]" aria-hidden="true" />
              </button>
            ) : singleCartItem ? (
              <CartItemStepper
                item={singleCartItem}
                onChange={onUpdateCartItem}
                pending={pendingKey === singleCartItem.id}
                readonly={activeVariants.length > 1 && singleCartItem.variant_id !== null}
                onReadonlyClick={onOpenOptions}
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
                    onAddVariant(product, defaultVariant);
                  }
                }}
                disabled={Boolean(!hasOptions && pendingAddKey && pendingKey === pendingAddKey)}
                className="inline-flex h-[36px] min-w-[76px] shrink-0 flex-col items-center justify-center rounded-xl border border-primary bg-white px-2 shadow-sm transition active:scale-95 disabled:opacity-70"
              >
                {!hasOptions && pendingAddKey && pendingKey === pendingAddKey ? (
                  <span className="text-[10px] font-bold tracking-wide text-primary">...</span>
                ) : (
                  <>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary leading-none">
                      ADD
                    </span>
                    {hasOptions && (
                      <span className="mt-0.5 text-[8px] font-bold text-primary/70 leading-none">
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

function VariantPicker({
  cartItems,
  onAddCustom,
  onAddVariant,
  onUpdateCartItem,
  pendingKey,
  product,
}: {
  cartItems: CartItem[];
  onAddCustom: (product: StoreProduct, customValue: number) => void;
  onAddVariant: (product: StoreProduct, variant: StoreProductVariant) => void;
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
    <div className="px-4 pb-6 pt-2">
      <div className="mb-4">
        <h2 className="line-clamp-2 text-lg font-bold text-gray-900">
          {product.name}
        </h2>
      </div>

      <div className="mt-2 space-y-2.5">
        {activeVariants.map((variant) => {
          const cartItem = productCartItems.find(
            (item) => item.variant_id === variant.id,
          );
          const discountPercent = getDiscountPercent(variant);
          const hasDiscount = discountPercent > 0;

          return (
            <div
              key={variant.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">
                  {getVariantMeasurement(variant)}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[15px] font-extrabold text-gray-900">
                    {formatPrice(variant.price)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-[11px] font-semibold text-gray-400 line-through">
                        {formatPrice(variant.mrp ?? 0)}
                      </span>
                      <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
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
                  size="large"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onAddVariant(product, variant)}
                  disabled={pendingKey === variant.id}
                  className="inline-flex h-[40px] min-w-[84px] items-center justify-center rounded-xl border border-primary bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-primary shadow-sm disabled:opacity-70"
                >
                  {pendingKey === variant.id ? "..." : "ADD"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {product.allow_custom_quantity && (
        <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900">Custom quantity</p>
              <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                Step by {formatMeasuredQuantity(quantityStep, product.measurement_type, displayUnit)}
              </p>
            </div>
            <div className="flex h-[40px] min-w-[120px] items-center justify-between rounded-xl bg-white text-gray-900 shadow-sm ring-1 ring-gray-200">
              <button
                type="button"
                onClick={() =>
                  setCustomValue((value) => Math.max(minimumQuantity, value - quantityStep))
                }
                aria-label="Decrease custom quantity"
                disabled={customValue <= minimumQuantity}
                className="flex h-full w-10 items-center justify-center disabled:text-gray-300"
              >
                <i className="fa-solid fa-minus text-[10px]" aria-hidden="true" />
              </button>
              <span className="px-1 text-center text-sm font-bold">
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

          {customCartItem ? (
            <button
              type="button"
              onClick={() => onUpdateCartItem(customCartItem, customValue)}
              disabled={pendingKey === customCartItem.id}
              className="mt-4 h-12 w-full rounded-xl bg-primary px-4 text-[13px] font-bold uppercase tracking-wider text-white shadow-sm disabled:opacity-70"
            >
              Update Cart
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAddCustom(product, customValue)}
              disabled={pendingKey === `${product.id}:custom`}
              className="mt-4 h-12 w-full rounded-xl bg-primary px-4 text-[13px] font-bold uppercase tracking-wider text-white shadow-sm disabled:opacity-70"
            >
              {pendingKey === `${product.id}:custom` ? "Adding..." : "Add to Cart"}
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
  onReadonlyClick,
  pending,
  readonly = false,
  size = "small",
}: {
  item: CartItem;
  onChange: (item: CartItem, nextValue: number) => void;
  onReadonlyClick?: () => void;
  pending: boolean;
  readonly?: boolean;
  size?: "small" | "large";
}) {
  const isCustomItem = item.custom_value !== null;
  const step = item.quantity_step ?? 1;
  const value = isCustomItem ? item.custom_value ?? step : item.quantity;
  const label = isCustomItem
    ? formatMeasuredQuantity(value, item.measurement_type, item.unit)
    : String(item.quantity);

  const containerHeight = size === "large" ? "h-[40px]" : "h-[36px]";
  const btnWidth = size === "large" ? "w-10" : "w-8";
  const iconSize = size === "large" ? "text-[11px]" : "text-[10px]";
  const textSize = size === "large" ? "text-[14px]" : "text-[12px]";

  if (readonly) {
    return (
      <div className={`flex min-w-[76px] shrink-0 ${containerHeight} items-center justify-between rounded-xl border border-gray-200 bg-gray-50 text-gray-700`}>
        <button
          type="button"
          onClick={onReadonlyClick}
          aria-label="Choose cart item"
          disabled={pending}
          className={`flex h-full ${btnWidth} items-center justify-center disabled:opacity-50`}
        >
          <i className={`fa-solid fa-minus ${iconSize}`} aria-hidden="true" />
        </button>
        <span className={`${textSize} font-bold`}>
          {label}
        </span>
        <button
          type="button"
          onClick={onReadonlyClick}
          aria-label="Choose cart item"
          disabled={pending}
          className={`flex h-full ${btnWidth} items-center justify-center disabled:opacity-50`}
        >
          <i className={`fa-solid fa-plus ${iconSize}`} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex min-w-[76px] shrink-0 ${containerHeight} items-center justify-between rounded-xl border border-primary bg-primary text-white shadow-sm`}>
      <button
        type="button"
        onClick={() => onChange(item, value - step)}
        aria-label="Decrease cart item"
        disabled={pending || (isCustomItem && value <= step)}
        className={`flex h-full ${btnWidth} items-center justify-center disabled:opacity-70`}
      >
        <i className={`fa-solid fa-minus ${iconSize}`} aria-hidden="true" />
      </button>
      <span className={`px-0.5 text-center ${textSize} font-bold leading-none`}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(item, value + step)}
        aria-label="Increase cart item"
        disabled={pending}
        className={`flex h-full ${btnWidth} items-center justify-center disabled:opacity-70`}
      >
        <i className={`fa-solid fa-plus ${iconSize}`} aria-hidden="true" />
      </button>
    </div>
  );
}

function OpeningHoursRow({
  day,
  hours,
}: {
  day: string;
  hours?: StoreDayHours;
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="font-semibold capitalize text-gray-900">{day}</span>
      <div className="space-y-1 text-right text-gray-500">
        {getDayHourLines(hours).map((line) => (
          <div key={line} className="font-medium">{line}</div>
        ))}
      </div>
    </div>
  );
}

function getDaysFromToday() {
  const todayIndex = new Date().getDay();
  return [...DAYS.slice(todayIndex), ...DAYS.slice(0, todayIndex)];
}

function getDayHourLines(hours?: StoreDayHours) {
  if (!hours || hours.is_closed || hours.slots.length === 0) return ["Closed"];

  return hours.slots.map(
    (slot) => `${formatTime(slot.open)} - ${formatTime(slot.close)}`,
  );
}

function formatTime(value: string) {
  const [hour = "0", minute = "00"] = value.split(":");
  const hourNumber = Number(hour);
  const period = hourNumber >= 12 ? "PM" : "AM";
  const displayHour = hourNumber % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
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

function formatQuantity(value: number | null, unit?: string) {
  if (!value) return "any amount";

  if (unit === "g" && value >= 1000) {
    return `${value / 1000} kg`;
  }

  return `${value} ${unit ?? ""}`.trim();
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
