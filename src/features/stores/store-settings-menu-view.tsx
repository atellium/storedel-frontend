"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/features/auth/auth-guard";

const SETTINGS_OPTIONS = [
  {
    title: "Store info",
    description: "Name, address, contact details, and store profile.",
    icon: "fa-store",
    href: "store-info",
  },
  {
    title: "Pickup & delivery",
    description: "Pickup prep time, delivery range, fees, and scheduled slots.",
    icon: "fa-truck-fast",
    href: "pickup-delivery",
  },
  {
    title: "Store QR code",
    description: "Download a QR code that opens your public store page.",
    icon: "fa-qrcode",
    href: "qr-code",
  },
];

export function StoreSettingsMenuView({ storeSlug }: { storeSlug: string }) {
  return (
    <AuthGuard>
      <StoreSettingsMenuContent storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function StoreSettingsMenuContent({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] pb-28 text-gray-900">
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

          <h1 className="text-base font-bold text-gray-900">Settings</h1>

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
            Manage settings
          </h2>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-gray-100 bg-white shadow-sm">
          {SETTINGS_OPTIONS.map((option) => (
            <SettingsOptionRow
              key={option.title}
              description={option.description}
              href={`/${storeSlug}/manage/settings/${option.href}`}
              icon={option.icon}
              title={option.title}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function SettingsOptionRow({
  description,
  href,
  icon,
  title,
}: {
  description: string;
  href: string;
  icon: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-gray-100 p-4 transition hover:bg-gray-50 active:bg-gray-100 last:border-b-0"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-primary">
        <i className={`fa-solid ${icon} text-sm`} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-extrabold text-gray-900">{title}</h3>
        <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-gray-500">
          {description}
        </p>
      </div>
      <i className="fa-solid fa-chevron-right text-[10px] text-gray-300" aria-hidden="true" />
    </Link>
  );
}
