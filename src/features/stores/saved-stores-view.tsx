"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { AuthButton } from "@/features/auth/auth-button";
import { hasAuthTokens } from "@/features/auth/token";
import { useAppSelector } from "@/store/hooks";
import { getSavedStores, getStores } from "./stores-service";
import type { SavedStore, Store } from "./types";

export function SavedStoresView({ stores: _stores }: { stores: Store[] }) {
  void _stores;

  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const isAuthenticated = Boolean(user) && hasAuthTokens();
  const [savedStores, setSavedStores] = useState<SavedStore[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("idle");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Store[]>([]);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "error">("idle");
  const [isLinkEntryOpen, setIsLinkEntryOpen] = useState(false);
  const [storeLink, setStoreLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const hasSearchQuery = query.trim().length > 0;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    Promise.resolve()
      .then(() => {
        if (!isMounted) return null;
        setStatus("loading");
        return getSavedStores();
      })
      .then((response) => {
        if (!isMounted) return;
        if (!response) return;
        setSavedStores(Array.isArray(response.results) ? response.results : []);
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setSavedStores([]);
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const searchTerm = query.trim();

    if (!searchTerm) {
      return;
    }

    let isMounted = true;
    const timeoutId = window.setTimeout(() => {
      setSearchStatus("loading");

      getStores({ search: searchTerm })
        .then((nextStores) => {
          if (!isMounted) return;
          setSearchResults(nextStores);
          setSearchStatus("idle");
        })
        .catch(() => {
          if (!isMounted) return;
          setSearchResults([]);
          setSearchStatus("error");
        });
    }, 500);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);

    if (!nextQuery.trim()) {
      setSearchResults([]);
      setSearchStatus("idle");
    }
  };

  const handleStoreLinkSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const slug = getStoreSlugFromInput(storeLink);
    if (!slug) {
      setLinkError("Enter a valid Storedel store link or slug.");
      return;
    }

    setLinkError("");
    router.push(`/${slug}`);
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-160 bg-white text-gray-900">
      <header className="sticky top-0 z-20 bg-white px-3 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="Storedel home" className="shrink-0 transition active:scale-95">
            <Image
              src="/images/storedel-logo.png"
              alt="Storedel"
              width={112}
              height={34}
              priority
              className="h-6 w-auto object-contain"
            />
          </Link>
          <AuthButton
            href="/profile"
            aria-label="Profile"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100"
          >
            <i className="fa-solid fa-user text-base" aria-hidden="true" />
          </AuthButton>
        </div>
      </header>

      <div className="space-y-8 px-3">
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-black tracking-tight text-gray-900">
              My Stores
            </h2>
            <p className="text-xs font-medium leading-relaxed text-gray-500">
              Quickly access stores you&apos;ve saved or visited.
            </p>
          </div>

          {isAuthenticated ? (
            <SavedStoresSection savedStores={savedStores} status={status} />
          ) : (
            <NonEmptyState
              icon="fa-regular fa-bookmark"
              title="Sign in to see your saved stores"
              message="Your saved stores and recently ordered shops will appear here after you log in."
            />
          )}
        </section>

        <section>
          <div className="mb-3">
            <h1 className="text-lg font-black tracking-tight text-gray-900">
              Find your store
            </h1>
            <p className="text-xs font-medium leading-relaxed text-gray-500">
              Access a store by searching, scanning their QR, or using a link.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative flex h-[52px] w-full items-center rounded-[20px] border border-gray-200 bg-gray-50/50 px-3 transition-all focus-within:border-primary/50 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20">
              <i className="fa-solid fa-magnifying-glass mr-3 text-[14px] text-gray-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={handleQueryChange}
                placeholder="Search store name..."
                className="h-full min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-gray-900 outline-none placeholder:font-medium placeholder:text-gray-400"
              />
            </div>

            {hasSearchQuery && (
              <SearchResultsPanel stores={searchResults} status={searchStatus} />
            )}

            {!hasSearchQuery && (
              <>
                <Divider />

                <button
                  type="button"
                  className="flex w-full items-center gap-4 rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:border-gray-200 active:scale-[0.98]"
                >
                  <div className="flex size-[44px] shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <i className="fa-solid fa-qrcode text-[18px]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="text-[14px] font-extrabold text-gray-900">Scan QR Code</h3>
                    <p className="mt-0.5 text-[11px] font-medium leading-snug text-gray-500">
                      Scan a store&apos;s Storedel QR code in person.
                    </p>
                  </div>
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                    <i className="fa-solid fa-chevron-right text-[10px]" aria-hidden="true" />
                  </div>
                </button>

                <Divider />

                <button
                  type="button"
                  onClick={() => setIsLinkEntryOpen((isOpen) => !isOpen)}
                  className="flex w-full items-center gap-4 rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:border-gray-200 active:scale-[0.98]"
                >
                  <div className="flex size-[44px] shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                    <i className="fa-solid fa-link text-[16px]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="text-[14px] font-extrabold text-gray-900">Open Store Link</h3>
                    <p className="mt-0.5 text-[11px] font-medium leading-snug text-gray-500">
                      Paste a link shared via WhatsApp or social media.
                    </p>
                  </div>
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                    <i className="fa-solid fa-chevron-right text-[10px]" aria-hidden="true" />
                  </div>
                </button>

                {isLinkEntryOpen && (
                  <form
                    onSubmit={handleStoreLinkSubmit}
                    className="rounded-[20px] border border-gray-100 bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                  >
                    <div className="flex h-11 items-center gap-2 rounded-[14px] border border-gray-200 px-3">
                      <input
                        type="text"
                        value={storeLink}
                        onChange={(event) => {
                          setStoreLink(event.target.value);
                          setLinkError("");
                        }}
                        placeholder="storedel.com/store-slug"
                        className="min-w-0 flex-1 text-[13px] font-medium text-gray-900 outline-none placeholder:text-gray-400"
                      />
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center rounded-[10px] bg-primary px-3 text-[10px] font-extrabold uppercase tracking-wider text-white"
                      >
                        Open
                      </button>
                    </div>
                    {linkError && (
                      <p className="mt-2 px-1 text-[11px] font-semibold text-red-500">
                        {linkError}
                      </p>
                    )}
                  </form>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SavedStoresSection({
  savedStores,
  status,
}: {
  savedStores: SavedStore[];
  status: "loading" | "idle" | "error";
}) {
  if (status === "loading") {
    return <SavedStoreSkeletonList />;
  }

  if (status === "error") {
    return (
      <NonEmptyState
        tone="error"
        icon="fa-solid fa-triangle-exclamation"
        title="Could not load saved stores"
        message="Please try again after a moment."
      />
    );
  }

  if (savedStores.length === 0) {
    return (
      <NonEmptyState
        icon="fa-regular fa-bookmark"
        title="No saved stores yet"
        message="Search for a store below and save it for quick access here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {savedStores.map((savedStore) => (
        <StoreCard key={savedStore.id} store={savedStore.store} />
      ))}
    </div>
  );
}

function StoreCard({ store }: { store: Store }) {
  const address = [store.locality, store.city.name].filter(Boolean).join(", ");
  const fulfillmentOptions = getFulfillmentOptions(store);
  const isOpen = store.is_active;

  return (
    <Link
      href={`/${store.slug}`}
      className="group flex flex-col rounded-[20px] bg-white p-3.5 shadow-[0_0_18px_rgba(15,23,42,0.08)] transition-all hover:shadow-[0_0_22px_rgba(15,23,42,0.12)] active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div className="relative flex size-15 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-gray-100/60 bg-gray-50 text-2xl text-gray-300">
          {store.cover_image ? (
            <Image
              src={store.cover_image}
              alt={store.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <i className="fa-solid fa-store" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black leading-tight text-gray-900">
            {store.name}
          </h3>

          {store.title && (
            <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {store.title}
            </p>
          )}

          <div className="mt-0.5">
            <StoreStatusBadge isOpen={isOpen} />
          </div>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[11px] font-semibold text-gray-500">
          <i className="fa-solid fa-location-dot mr-1 text-[9px] opacity-70" aria-hidden="true" />
          <span className="capitalize">{address}</span>
        </p>
        <div
          className={`inline-flex h-9 shrink-0 items-center justify-center rounded-[10px] pl-4 pr-3.5 text-[10px] font-extrabold uppercase tracking-wider shadow-sm transition ${
            isOpen
              ? "bg-primary text-white group-hover:bg-primary/90"
              : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
          }`}
        >
          {isOpen ? "Order Now" : "View Store"}
          <i className="fa-solid fa-chevron-right ml-1.5 text-[9px]" aria-hidden="true" />
        </div>
      </div>

      {fulfillmentOptions.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center justify-center text-center text-[11px] font-semibold">
          {fulfillmentOptions.map((option, index) => (
            <span key={option.label} className="inline-flex items-center">
              {index > 0 && <span className="mx-1.5 text-gray-300">&bull;</span>}
              <span className={option.className}>{option.label}</span>
            </span>
          ))}
        </p>
      )}
    </Link>
  );
}

function SavedStoreSkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col rounded-[20px] border border-gray-100 bg-white p-3.5 shadow-[0_0_18px_rgba(15,23,42,0.08)]"
        >
          <div className="flex items-start gap-3">
            <div className="size-[56px] shrink-0 animate-pulse rounded-[14px] bg-gray-100" />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="h-3.5 w-36 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
              </div>
              <div className="mt-2 h-2.5 w-24 animate-pulse rounded bg-gray-100" />

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-9 w-24 shrink-0 animate-pulse rounded-[10px] bg-gray-100" />
          </div>

          <div className="mx-auto mt-3 h-3 w-48 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function StoreStatusBadge({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <span className="relative flex size-1.5">
        {isOpen && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex size-1.5 rounded-full ${
            isOpen ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
      </span>
      <span
        className={`text-[8px] font-extrabold uppercase tracking-wider ${
          isOpen ? "text-emerald-700" : "text-red-600"
        }`}
      >
        {isOpen ? "Open" : "Closed"}
      </span>
    </div>
  );
}

function SearchResultsPanel({
  stores,
  status,
}: {
  stores: Store[];
  status: "idle" | "loading" | "error";
}) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-sm">
      {status === "loading" && (
        <div className="px-3 py-4 text-[12px] font-semibold text-gray-500">
          Searching stores...
        </div>
      )}

      {status === "error" && (
        <div className="px-3 py-4 text-[12px] font-bold text-red-500">
          Could not search stores.
        </div>
      )}

      {status === "idle" && stores.length === 0 && (
        <div className="px-3 py-4 text-[12px] font-semibold text-gray-500">
          No stores found.
        </div>
      )}

      {status === "idle" && stores.length > 0 && (
        <div className="divide-y divide-gray-100">
          {stores.map((store) => (
            <SearchStoreRow key={store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchStoreRow({ store }: { store: Store }) {
  const location = [store.locality, store.city.name, store.pincode]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/${store.slug}`}
      className="flex items-center gap-3 px-3 py-3 transition-colors active:bg-gray-50"
    >
      <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-gray-300">
        {store.cover_image ? (
          <Image
            src={store.cover_image}
            alt={store.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <i className="fa-solid fa-store text-sm" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-extrabold text-gray-900">
          {store.name}
        </h2>
        <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
          {location}
        </p>
      </div>
      <i className="fa-solid fa-chevron-right text-[10px] text-gray-300" aria-hidden="true" />
    </Link>
  );
}

function NonEmptyState({
  icon,
  message,
  title,
  tone = "neutral",
}: {
  icon: string;
  message: string;
  title: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      className={`flex min-h-[160px] flex-col items-center justify-center rounded-[20px] border px-6 py-8 text-center shadow-sm ${
        tone === "error"
          ? "border-red-100 bg-red-50 text-red-500"
          : "border-gray-100 bg-white text-gray-500"
      }`}
    >
      <div
        className={`flex size-14 items-center justify-center rounded-full ${
          tone === "error" ? "bg-white text-red-400" : "bg-gray-50 text-gray-300"
        }`}
      >
        <i className={`${icon} text-xl`} aria-hidden="true" />
      </div>
      <p className={`mt-4 text-[14px] font-extrabold ${tone === "error" ? "text-red-500" : "text-gray-900"}`}>
        {title}
      </p>
      <p className="mt-1 max-w-[260px] text-[12px] font-medium leading-relaxed">
        {message}
      </p>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-100" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Or</span>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
  );
}

function getFulfillmentOptions(store: Store) {
  const deliveryStatus = store.delivery_status;

  return [
    deliveryStatus?.pickup?.is_enabled
      ? { label: "Pickup", className: "text-purple-700" }
      : null,
    deliveryStatus?.express_delivery?.is_enabled
      ? { label: "Express Delivery", className: "text-orange-700" }
      : null,
    deliveryStatus?.scheduled_delivery?.is_enabled
      ? { label: "Scheduled Delivery", className: "text-blue-700" }
      : null,
  ].filter(
    (option): option is { label: string; className: string } => Boolean(option),
  );
}

function getStoreSlugFromInput(input: string) {
  const trimmedInput = input.trim();
  if (!trimmedInput) return "";

  try {
    const url = new URL(trimmedInput.includes("://") ? trimmedInput : `https://${trimmedInput}`);
    const slug = url.pathname.split("/").filter(Boolean)[0];
    return sanitizeSlug(slug);
  } catch {
    return sanitizeSlug(trimmedInput);
  }
}

function sanitizeSlug(value: string | undefined) {
  if (!value) return "";
  const slug = value.trim().replace(/^\/+|\/+$/g, "");
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) ? slug : "";
}
