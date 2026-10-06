"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ownerNavItems = [
  {
    href: "dashboard",
    icon: "fa-table-columns",
    label: "Dashboard",
  },
  {
    href: "orders",
    icon: "fa-receipt",
    label: "Orders",
  },
  {
    href: "products",
    icon: "fa-box-open",
    label: "Products",
  },
  {
    href: "settings",
    icon: "fa-gear",
    label: "Settings",
  },
];

export function OwnerBottomNav({ storeSlug }: { storeSlug: string }) {
  const pathname = usePathname();

  if (
    isOrderDetailPath(pathname, storeSlug) ||
    isSettingsDetailPath(pathname, storeSlug)
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Business owner navigation"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[640px] border-t border-gray-100 bg-white px-3 pb-3 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]"
    >
      <div className="grid h-14 grid-cols-4 rounded-full bg-gray-100 p-1">
        {ownerNavItems.map((item) => {
          const href = `/${storeSlug}/manage/${item.href}`;
          const active =
            pathname === href ||
            (item.href !== "dashboard" && pathname.startsWith(`${href}/`));

          return (
            <Link
              key={item.href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-full transition-colors ${
                active
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <i className={`fa-solid ${item.icon} text-base`} aria-hidden="true" />
              <span className="max-w-full truncate text-[10px] font-semibold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function isOrderDetailPath(pathname: string, storeSlug: string) {
  const segments = pathname.split("/").filter(Boolean);

  return (
    segments[0] === storeSlug &&
    segments[1] === "manage" &&
    segments[2] === "orders" &&
    Boolean(segments[3]) &&
    (segments.length === 4 ||
      (segments.length === 5 && segments[4] === "preparing"))
  );
}

function isSettingsDetailPath(pathname: string, storeSlug: string) {
  const segments = pathname.split("/").filter(Boolean);

  return (
    segments[0] === storeSlug &&
    segments[1] === "manage" &&
    segments[2] === "settings" &&
    Boolean(segments[3])
  );
}
