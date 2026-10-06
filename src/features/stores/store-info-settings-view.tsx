"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/features/auth/auth-guard";
import { getMyStoreBySlug } from "./stores-service";
import type { MyStoreDetails } from "./types";

const SUPPORT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

const DETAIL_SECTIONS = [
  {
    title: "Store profile",
    icon: "fa-store",
    fields: [
      ["Name", "name"],
      ["Title", "title"],
      ["Status", "status"],
      ["Published", "published"],
    ],
  },
  {
    title: "Location",
    icon: "fa-location-dot",
    fields: [
      ["Address", "address"],
      ["Locality", "locality"],
      ["City", "city"],
      ["State", "state"],
      ["Pincode", "pincode"],
    ],
  },
  {
    title: "Contact",
    icon: "fa-address-book",
    fields: [
      ["Phone", "phone"],
      ["WhatsApp", "whatsapp"],
      ["Email", "email"],
      ["Website", "website"],
    ],
  },
] as const;

export function StoreInfoSettingsView({ storeSlug }: { storeSlug: string }) {
  return (
    <AuthGuard>
      <StoreInfoSettingsContent storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function StoreInfoSettingsContent({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const [store, setStore] = useState<MyStoreDetails | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  useEffect(() => {
    let isMounted = true;

    getMyStoreBySlug(storeSlug)
      .then((nextStore) => {
        if (!isMounted) return;
        setStore(nextStore);
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

  const supportHref = useMemo(() => {
    const phone = getWhatsAppPhone(SUPPORT_NUMBER);
    if (!phone) return "";

    const message = store
      ? `Hi, I want to change the details for ${store.name} (${store.slug}).`
      : "Hi, I want to change my store details.";

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }, [store]);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] pb-10 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex h-10 items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-base" aria-hidden="true" />
          </button>

          <h1 className="text-base font-bold text-gray-900">Store info</h1>

          <Link
            href={`/${storeSlug}/manage/dashboard`}
            aria-label="Dashboard"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-primary transition active:scale-95"
          >
            <i className="fa-solid fa-chart-line text-sm" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="px-4 py-5">
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Store controls
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
            Store details
          </h2>
        </div>

        {status === "loading" && (
          <StatusCard message="Loading store details..." />
        )}

        {status === "error" && (
          <StatusCard message="Could not load store details." tone="error" />
        )}

        {status === "idle" && store && (
          <div className="space-y-4">
            {getCoverImageSrc(store.cover_image) && (
              <div className="relative h-40 overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-sm">
                <Image
                  src={getCoverImageSrc(store.cover_image)}
                  alt={store.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 640px"
                  className="object-cover"
                />
              </div>
            )}

            {DETAIL_SECTIONS.map((section) => (
              <section
                key={section.title}
                className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-sm"
              >
                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-primary">
                    <i className={`fa-solid ${section.icon} text-sm`} aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-900">
                    {section.title}
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {section.fields.map(([label, key]) => (
                    <DetailRow
                      key={key}
                      label={label}
                      value={getStoreDetailValue(store, key)}
                    />
                  ))}
                </div>
              </section>
            ))}

            <SupportCard href={supportHref} />
          </div>
        )}
      </section>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[112px_1fr] gap-3 px-4 py-3">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </dt>
      <dd className="min-w-0 break-words text-right text-[13px] font-bold leading-5 text-gray-900">
        {value || "-"}
      </dd>
    </div>
  );
}

function StatusCard({
  message,
  tone = "default",
}: {
  message: string;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-6 text-center text-sm font-medium shadow-sm ${
        tone === "error"
          ? "border-red-100 bg-red-50 text-red-500"
          : "border-gray-100 bg-white text-gray-500"
      }`}
    >
      {message}
    </div>
  );
}

function SupportCard({ href }: { href: string }) {
  const disabled = !href;

  return (
    <section className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <i className="fa-brands fa-whatsapp text-lg" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold text-gray-900">
            Need to change these details?
          </h3>
          <p className="mt-1 text-[12px] font-medium leading-5 text-gray-500">
            Contact support on WhatsApp and we will help update your store information.
          </p>
        </div>
      </div>

      {disabled ? (
        <button
          type="button"
          disabled
          className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-gray-200 px-4 text-sm font-bold uppercase tracking-wider text-gray-500"
        >
          Support unavailable
        </button>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98]"
        >
          <i className="fa-brands fa-whatsapp text-base" aria-hidden="true" />
          Contact support
        </a>
      )}
    </section>
  );
}

function getStoreDetailValue(store: MyStoreDetails, key: string) {
  const address = [store.address, store.locality, store.city?.name, store.pincode]
    .filter(Boolean)
    .join(", ");

  const values: Record<string, string> = {
    address,
    city: store.city?.name ?? "",
    email: store.email,
    locality: store.locality,
    name: store.name,
    phone: store.phone,
    pincode: store.pincode,
    published: store.published_at ? formatDateTime(store.published_at) : "Not published",
    state: store.city?.state?.name ?? "",
    status: store.is_active ? "Active" : "Inactive",
    title: store.title ?? "",
    website: store.website,
    whatsapp: store.whatsapp,
  };

  return values[key] ?? "";
}

function getCoverImageSrc(value: string | null) {
  if (!value) return "";

  try {
    const url = new URL(value, window.location.origin);
    const proxiedImageUrl = url.pathname === "/_next/image" ? url.searchParams.get("url") : null;

    return proxiedImageUrl ? decodeURIComponent(proxiedImageUrl) : value;
  } catch {
    return value;
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getWhatsAppPhone(value: string) {
  const phone = value.replace(/\D/g, "");
  if (!phone) return "";
  return phone.startsWith("91") ? phone : `91${phone}`;
}
