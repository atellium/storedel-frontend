"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { AuthButton } from "@/features/auth/auth-button";
import { hasAuthTokens } from "@/features/auth/token";
import { useAppSelector } from "@/store/hooks";
import { getNearbyStores, getSavedStores, getStores } from "./stores-service";
import type { SavedStore, Store } from "./types";

export function SavedStoresView({ stores: _stores }: { stores: Store[] }) {
  void _stores;

  const { user } = useAppSelector((state) => state.auth);
  const location = useAppSelector((state) => state.preferences.location);
  const isAuthenticated = Boolean(user) && hasAuthTokens();
  const [savedStores, setSavedStores] = useState<SavedStore[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("idle");
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  const [nearbyStatus, setNearbyStatus] = useState<"idle" | "loading" | "error">("idle");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Store[]>([]);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "error">("idle");
  const hasSearchQuery = query.trim().length > 0;
  const showNearbyStores =
    !hasSearchQuery &&
    Boolean(location) &&
    (!isAuthenticated || (status === "idle" && savedStores.length === 0));

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
        if (!isMounted || !response) return;
        setSavedStores(Array.isArray(response.results) ? response.results : []);
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
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
    }, 300);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    if (!showNearbyStores || !location) {
      return;
    }

    let isMounted = true;

    Promise.resolve()
      .then(() => {
        if (!isMounted) return null;
        setNearbyStatus("loading");
        return getNearbyStores({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      })
      .then((nextStores) => {
        if (!isMounted || !nextStores) return;
        setNearbyStores(nextStores);
        setNearbyStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setNearbyStores([]);
        setNearbyStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [location, showNearbyStores]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);

    if (!nextQuery.trim()) {
      setSearchResults([]);
      setSearchStatus("idle");
    }
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-160 bg-white text-gray-900 pb-12">
      <header className="sticky top-0 z-20 bg-white px-3 pt-3 backdrop-blur">
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
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-95"
          >
            <i className="fa-solid fa-user text-base" aria-hidden="true" />
          </AuthButton>
        </div>
      </header>

      {/* Premium Search Bar */}
      <div className="px-3 pt-3">
        <label className="relative flex h-15 w-full items-center rounded-xl bg-gray-100 px-4 transition-all focus-within:bg-gray-50 focus-within:ring-1 focus-within:ring-primary/20">
          <i className="fa-solid fa-magnifying-glass mr-3 text-sm text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search your local stores..."
            className="min-w-0 flex-1 bg-transparent text-[15 px] font-semibold text-gray-900 outline-none placeholder:font-medium placeholder:text-gray-400"
          />
        </label>

        {hasSearchQuery && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {searchStatus === "loading" && (
              <div className="px-4 py-4 text-sm font-semibold text-gray-500">
                Searching stores...
              </div>
            )}

            {searchStatus === "error" && (
              <div className="px-4 py-4 text-sm font-bold text-red-500">
                Could not search stores.
              </div>
            )}

            {searchStatus === "idle" && searchResults.length === 0 && (
              <div className="px-4 py-4 text-sm font-semibold text-gray-500">
                No stores found.
              </div>
            )}

            {searchStatus === "idle" && searchResults.length > 0 && (
              <div className="divide-y divide-gray-100">
                {searchResults.map((store) => (
                  <SearchStoreRow key={store.id} store={store} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <section className="px-3 py-5">
        {isAuthenticated && (
          <div className="mb-8">
            <div className="mb-3">
              <h1 className="mt-0.5 ml-1 text-sm uppercase font-medium text-gray-400 tracking-[2px]">
                Saved & Ordered from
              </h1>
            </div>

            {status === "loading" && (
              <div className="rounded-[20px] border border-gray-100 bg-white px-4 py-10 text-center text-sm font-medium text-gray-500 shadow-sm">
                Loading saved stores...
              </div>
            )}

            {status === "error" && (
              <div className="rounded-[20px] border border-red-100 bg-red-50 px-4 py-10 text-center text-sm font-bold text-red-500 shadow-sm">
                Could not load saved stores.
              </div>
            )}

            {status === "idle" && savedStores.length === 0 && (
              <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[20px] border border-gray-100 bg-white px-6 py-10 text-center shadow-sm">
                <div className="flex size-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                  <i className="fa-regular fa-bookmark text-2xl" aria-hidden="true" />
                </div>
                <p className="mt-5 text-[15px] font-extrabold text-gray-900">
                  No saved stores yet
                </p>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  Stores you save will appear here for quick access.
                </p>
              </div>
            )}

            {status === "idle" && savedStores.length > 0 && (
              <div className="space-y-3">
                {savedStores.map((savedStore) => (
                  <StoreCard key={savedStore.id} store={savedStore.store} />
                ))}
              </div>
            )}
          </div>
        )}

        {showNearbyStores && (
          <div>
            <div className="mb-3">
              <h1 className="ml-1 mt-0.5 text-sm font-medium uppercase tracking-[2px] text-gray-400">
                Nearby Stores
              </h1>
            </div>

            {nearbyStatus === "loading" && (
              <div className="rounded-[20px] border border-gray-100 bg-white px-4 py-10 text-center text-sm font-medium text-gray-500 shadow-sm">
                Finding nearby stores...
              </div>
            )}

            {nearbyStatus === "error" && (
              <div className="rounded-[20px] border border-red-100 bg-red-50 px-4 py-10 text-center text-sm font-bold text-red-500 shadow-sm">
                Could not load nearby stores.
              </div>
            )}

            {nearbyStatus === "idle" && nearbyStores.length === 0 && (
              <div className="rounded-[20px] border border-gray-100 bg-white px-4 py-10 text-center text-sm font-bold text-gray-500 shadow-sm">
                No nearby stores found.
              </div>
            )}

            {nearbyStatus === "idle" && nearbyStores.length > 0 && (
              <div className="space-y-3">
                {nearbyStores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* <div>
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Explore
            </p>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-gray-900">
              Stores
            </h1>
          </div>

          {filteredStores.length > 0 ? (
            <div className="space-y-3">
              {filteredStores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-gray-100 bg-white px-4 py-10 text-center text-sm font-bold text-gray-500 shadow-sm">
              No stores found.
            </div>
          )}
        </div> */}
      </section>
    </main>
  );
}

function StoreCard({ store }: { store: Store }) {
  const address = [store.locality, store.city.name, store.city.state.name, store.pincode]
    .filter(Boolean)
    .join(", ");
  const fulfillmentBadges = getFulfillmentBadges(store);

  return (
    <Link
      href={`/${store.slug}`}
      className="group flex w-full items-stretch gap-3 overflow-hidden rounded-[20px] shadow border border-gray-100 bg-white p-2.5 transition-all hover:border-gray-200 active:scale-[0.98]"
    >
      <div className="relative flex h-[124px] w-[116px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-gray-100 text-3xl text-gray-300">
        {store.cover_image ? (
          <Image
            src={store.cover_image}
            alt={store.name}
            fill
            sizes="116px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <i className="fa-solid fa-store" aria-hidden="true" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <h2 className="truncate text-lg font-extrabold leading-snug text-gray-900">
          {store.name}
        </h2>
        {store.title && (
          <p className="mt-0.5 truncate text-[11px] font-bold uppercase text-primary">
            {store.title}
          </p>
        )}
        <p className="mt-1 flex min-w-0 items-center gap-1 text-[12px] font-medium text-gray-500">
          <i className="fa-solid fa-location-dot text-[9px] text-gray-400" aria-hidden="true" />
          <span className="truncate capitalize">{address}</span>
        </p>
        {typeof store.distance_km === "number" && (
          <p className="mt-1 text-[11px] font-bold text-primary">
            {formatDistance(store.distance_km)} away
          </p>
        )}

        {fulfillmentBadges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fulfillmentBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-gray-100 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-gray-600"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3">
          <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-[10px] font-bold uppercase tracking-wider text-white transition-colors">
            Order Now <i className="fa-solid fa-arrow-right text-[9px]" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

function getFulfillmentBadges(store: Store) {
  const deliveryStatus = store.delivery_status;
  if (!deliveryStatus) return [];

  return [
    deliveryStatus.pickup?.is_enabled ? "Pickup" : null,
    deliveryStatus.express_delivery?.is_enabled ? "Express" : null,
    deliveryStatus.scheduled_delivery?.is_enabled ? "Scheduled" : null,
  ].filter((badge): badge is string => Boolean(badge));
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
      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 text-gray-300">
        {store.cover_image ? (
          <Image
            src={store.cover_image}
            alt={store.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <i className="fa-solid fa-store text-sm" aria-hidden="true" />
          </div>
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
