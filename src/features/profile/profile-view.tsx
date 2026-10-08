"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/features/auth/auth-guard";
import { logoutThunk } from "@/features/auth/auth-slice";
import { getMyStores } from "@/features/stores/stores-service";
import type { StoreDetails } from "@/features/stores/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { hideSiteLoader, showSiteLoader } from "@/store/slices/ui-slice";

export function ProfileView() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [stores, setStores] = useState<StoreDetails[]>([]);
  const [storeStatus, setStoreStatus] = useState<"loading" | "idle" | "error">(
    "loading",
  );

  useEffect(() => {
    dispatch(hideSiteLoader());
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;

    getMyStores()
      .then((nextStores) => {
        if (!isMounted) return;
        setStores(Array.isArray(nextStores) ? nextStores : []);
        setStoreStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setStoreStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    dispatch(showSiteLoader("Logging out..."));
    void dispatch(logoutThunk()).finally(() => {
      dispatch(hideSiteLoader());
      router.replace("/stores");
    });
  };

  const handleShareApp = async () => {
    const appUrl = `${window.location.origin}/stores`;
    const shareText = `Shop from nearby local stores with Storedel. ${appUrl}`;
    const shareData = {
      title: "Storedel",
      text: shareText,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard?.writeText(shareText);
  };

  const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U";

  return (
    <main className="mx-auto h-dvh w-full max-w-[640px] overflow-y-auto overscroll-none bg-[#f4f7f8] text-gray-900">
      <header className="sticky top-0 z-20 bg-white/95 px-3 py-3 backdrop-blur shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex size-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-sm" aria-hidden="true" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Profile</h1>
        </div>
      </header>

      <section className="px-4 py-4 space-y-6">

        {/* Compact User Info Card */}
        <div className="flex items-center justify-between rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-white shadow-sm">
              {initial}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-extrabold text-gray-900">
                {user?.full_name || "-"}
              </h2>
              <p className="mt-0.5 truncate text-[11px] font-medium text-gray-500">
                {user?.phone || "-"}
              </p>
              <p className="truncate text-[11px] font-medium text-gray-500">
                {user?.email || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* My Stores Section */}
        {storeStatus === "idle" && stores.length > 0 && (
          <div>
            <h2 className="mb-3 pl-1 text-[15px] font-extrabold text-gray-900">
              My stores
            </h2>
            <div className="space-y-2.5">
              {stores.map((store) => (
                <MyStoreCard key={store.id} store={store} />
              ))}
            </div>
          </div>
        )}

        {/* More Options / Static Links */}
        <div>
          <h2 className="mb-3 pl-1 text-[15px] font-extrabold text-gray-900">
            More Options
          </h2>
          <div className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <StaticButton
              icon="fa-share-nodes"
              label="Share App"
              onClick={handleShareApp}
            />
            <StaticLink icon="fa-shield-halved" label="Privacy Policy" href="/privacy" />
            <StaticLink icon="fa-file-lines" label="Terms of Use" href="/terms" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-between p-4 transition-colors hover:bg-red-50/50 active:bg-red-50 text-red-600"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <i className="fa-solid fa-arrow-right-from-bracket text-sm" aria-hidden="true" />
                </div>
                <span className="text-[13px] font-bold">Log Out</span>
              </div>
            </button>
          </div>
        </div>

      </section>
    </main>
  );
}

function MyStoreCard({ store }: { store: StoreDetails }) {
  const address = [
    store.locality,
    store.city.name,
    store.city.state.name,
    store.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/${store.slug}/manage/dashboard`}
      className="group flex items-center gap-3 rounded-[20px] border border-gray-100 bg-white p-3 shadow-sm transition-all hover:border-gray-200 hover:shadow-md active:scale-[0.98]"
    >
      <div className="relative flex size-[56px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-gray-50 text-gray-300">
        {store.cover_image ? (
          <Image
            src={store.cover_image}
            alt={store.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <i className="fa-solid fa-store text-xl" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1 py-1">
        <h3 className="truncate text-[14px] font-extrabold text-gray-900">{store.name}</h3>
        <p className="mt-0.5 truncate text-[11px] font-medium text-gray-500">
          {address}
        </p>
        <span
          className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${store.is_active
              ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20"
              : "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
            }`}
        >
          {store.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mr-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-primary group-hover:text-white">
        <i className="fa-solid fa-chevron-right text-[10px]" aria-hidden="true" />
      </div>
    </Link>
  );
}

function StaticLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 active:bg-gray-100 last:border-none"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-gray-50 text-gray-500">
          <i className={`fa-solid ${icon} text-sm`} aria-hidden="true" />
        </div>
        <span className="text-[13px] font-bold text-gray-900">{label}</span>
      </div>
      <i className="fa-solid fa-chevron-right text-[10px] text-gray-300" aria-hidden="true" />
    </Link>
  );
}

function StaticButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 last:border-none"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-gray-50 text-gray-500">
          <i className={`fa-solid ${icon} text-sm`} aria-hidden="true" />
        </div>
        <span className="text-[13px] font-bold text-gray-900">{label}</span>
      </div>
      <i className="fa-solid fa-chevron-right text-[10px] text-gray-300" aria-hidden="true" />
    </button>
  );
}
