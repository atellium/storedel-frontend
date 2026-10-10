"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthButton } from "@/features/auth/auth-button";
import { hasAuthTokens } from "@/features/auth/token";
import { useAppSelector } from "@/store/hooks";
import { getSavedStores } from "./stores-service";
import type { SavedStore, Store } from "./types";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const STORE_OWNER_MESSAGE =
  "Hi Storedel, I am a store owner and want to get my store online. Please share setup and pricing details.";
const STORE_OWNER_WHATSAPP_URL = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(
      STORE_OWNER_MESSAGE,
    )}`
  : "#";

export function SavedStoresView({ stores: _stores }: { stores: Store[] }) {
  void _stores;

  const { user } = useAppSelector((state) => state.auth);
  const isAuthenticated = Boolean(user) && hasAuthTokens();
  const [savedStores, setSavedStores] = useState<SavedStore[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("idle");

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

  return (
    <main className="mx-auto h-dvh w-full max-w-160 overflow-y-auto overscroll-none bg-white text-gray-900">
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
              Your Stores
            </h2>
            <p className="text-xs font-medium leading-relaxed text-gray-500">
              Stores you've saved or ordered from.
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

        <section className="space-y-3">
          {/* <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px] bg-gray-100">
            <Image
              src="/images/local-store.jpg"
              alt="Local store"
              fill
              sizes="(max-width: 640px) 100vw, 640px"
              className="object-cover"
            />
          </div> */}

          <a
            href={STORE_OWNER_WHATSAPP_URL}
            target={STORE_OWNER_WHATSAPP_URL.startsWith("http") ? "_blank" : undefined}
            rel={STORE_OWNER_WHATSAPP_URL.startsWith("http") ? "noopener noreferrer" : undefined}
            className="flex items-center gap-3 rounded-[20px] bg-emerald-50 p-3.5 transition active:scale-[0.98]"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <i className="fa-solid fa-store text-2xl" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-black text-gray-900">
                Are you a store owner?
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-gray-500">
                Get your store online with Storedel.
              </span>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-extrabold text-primary">
                Get Started
                <i className="fa-solid fa-chevron-right text-[9px]" aria-hidden="true" />
              </span>
            </span>
          </a>
        </section>

        <section className="pt-3">
          <p className="text-left text-[30px] font-extrabold leading-tight text-gray-300/70">
            Your Local Store, <br />Now Online
          </p>
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

            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-9 w-24 shrink-0 animate-pulse rounded-[10px] bg-gray-100" />
          </div>
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

