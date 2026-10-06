"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/features/auth/auth-guard";
import { getStoreOrders } from "@/features/orders/orders-service";
import {
  getMyStoreProducts,
  getStoreBySlug,
  getStoreSettings,
  saveMyStoreSettings,
} from "@/features/stores/stores-service";
import type {
  StoreDetails,
  StoreSettings,
  StoreSettingsPayload,
  StoreSettingsSlots,
} from "@/features/stores/types";

const dashboardTabs = [
  {
    href: "orders",
    icon: "fa-receipt",
    title: "Orders",
    subtitle: "Manage fulfillment",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    href: "products",
    icon: "fa-box-open",
    title: "Products",
    subtitle: "Edit your catalog",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    href: "settings",
    icon: "fa-gear",
    title: "Settings",
    subtitle: "Store preferences",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
  },
];

export function StoreDashboardView({ storeSlug }: { storeSlug: string }) {
  return (
    <AuthGuard>
      <StoreDashboardContent storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function StoreDashboardContent({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const [storeName, setStoreName] = useState("Your Store");
  const [store, setStore] = useState<StoreDetails | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [showExpressDisableForm, setShowExpressDisableForm] = useState(false);
  const [expressDisableDate, setExpressDisableDate] = useState("");
  const [expressDisableTime, setExpressDisableTime] = useState("");
  const [savingExpress, setSavingExpress] = useState(false);
  const [showPickupDisableForm, setShowPickupDisableForm] = useState(false);
  const [pickupDisableDate, setPickupDisableDate] = useState("");
  const [pickupDisableTime, setPickupDisableTime] = useState("");
  const [savingPickup, setSavingPickup] = useState(false);
  const [placedOrderCount, setPlacedOrderCount] = useState<number | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getStoreBySlug(storeSlug),
      getStoreSettings(storeSlug),
      getStoreOrders({
        page: 1,
        pageSize: 1,
        status: "placed",
        storeSlug,
      }),
      getMyStoreProducts(storeSlug, 1),
    ])
      .then(([nextStore, nextSettings, placedOrders, products]) => {
        if (!isMounted) return;
        if (nextStore) {
          setStore(nextStore);
          setStoreName(nextStore.name);
        }
        if (nextSettings) {
          setSettings(nextSettings);
        }
        setPlacedOrderCount(placedOrders.pagination.total_items);
        setProductCount(products.pagination.total_items);
      })
      .catch(() => {
        // Silently fallback to "Your Store" on error
      });

    return () => {
      isMounted = false;
    };
  }, [storeSlug]);

  const expressDeliveryEnabledNow =
    !settings || !settings.is_express_delivery_temporarily_disabled;
  const pickupEnabledNow =
    !settings || !settings.is_pickup_temporarily_disabled;

  const handleExpressSwitchChange = async () => {
    if (!settings || savingExpress) return;

    if (!expressDeliveryEnabledNow) {
      await saveExpressDisableTill(null);
      setShowExpressDisableForm(false);
      return;
    }

    const nextOpening = getNextOpeningDate(store);
    setExpressDisableDate(formatDateInput(nextOpening));
    setExpressDisableTime(formatTimeInput(nextOpening));
    setShowExpressDisableForm(true);
  };

  const handlePickupSwitchChange = async () => {
    if (!settings || savingPickup) return;

    if (!pickupEnabledNow) {
      await savePickupDisableTill(null);
      setShowPickupDisableForm(false);
      return;
    }

    const nextOpening = getNextOpeningDate(store);
    setPickupDisableDate(formatDateInput(nextOpening));
    setPickupDisableTime(formatTimeInput(nextOpening));
    setShowPickupDisableForm(true);
  };

  const handleSaveExpressDisableTill = async () => {
    if (!expressDisableDate || !expressDisableTime) {
      return;
    }

    const disableTill = new Date(`${expressDisableDate}T${expressDisableTime}`).toISOString();
    await saveExpressDisableTill(disableTill);
    setShowExpressDisableForm(false);
  };

  const saveExpressDisableTill = async (disableTill: string | null) => {
    if (!settings) return;

    setSavingExpress(true);

    try {
      const payload = getPayloadFromSettings({
        ...settings,
        express_delivery_disable_till: disableTill,
      });
      console.log("Store settings payload", payload);
      const savedSettings = await saveMyStoreSettings(storeSlug, payload);
      setSettings(savedSettings);
    } catch {
      // Keep the current state if the update fails.
    } finally {
      setSavingExpress(false);
    }
  };

  const handleSavePickupDisableTill = async () => {
    if (!pickupDisableDate || !pickupDisableTime) {
      return;
    }

    const disableTill = new Date(`${pickupDisableDate}T${pickupDisableTime}`).toISOString();
    await savePickupDisableTill(disableTill);
    setShowPickupDisableForm(false);
  };

  const savePickupDisableTill = async (disableTill: string | null) => {
    if (!settings) return;

    setSavingPickup(true);

    try {
      const payload = getPayloadFromSettings({
        ...settings,
        pickup_disable_till: disableTill,
      });
      console.log("Store settings payload", payload);
      const savedSettings = await saveMyStoreSettings(storeSlug, payload);
      setSettings(savedSettings);
    } catch {
      // Keep the current state if the update fails.
    } finally {
      setSavingPickup(false);
    }
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900 pb-12">
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

          <h1 className="text-base font-bold text-gray-900">
            Dashboard
          </h1>

          <Link
            href={`/${storeSlug}`}
            aria-label="Public store"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-primary transition active:scale-95"
          >
            <i className="fa-solid fa-store text-sm" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <p className="text-[13px] font-semibold text-gray-500">
            Welcome back,
          </p>
          <h2 className="mt-0.5 text-2xl font-black tracking-tight text-gray-900">
            {storeName}
          </h2>
        </div>

        {/* 2x2 Grid Tabs */}
        <div className="grid grid-cols-2 gap-3">
          {dashboardTabs.map((tab) => (
            <Link
              key={tab.href}
              href={`/${storeSlug}/manage/${tab.href}`}
              className="relative flex flex-col items-start rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:border-primary/20 hover:shadow-md active:scale-[0.98]"
            >
              {tab.href === "orders" && (
                <span className="absolute right-3 top-3 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-600">
                  {formatCount(placedOrderCount)}
                </span>
              )}
              {tab.href === "products" && (
                <span className="absolute right-3 top-3 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase text-orange-600">
                  {formatCount(productCount)}
                </span>
              )}
              <div className={`mb-4 flex size-10 items-center justify-center rounded-full ${tab.iconBg} ${tab.iconColor}`}>
                <i className={`fa-solid ${tab.icon} text-[15px]`} aria-hidden="true" />
              </div>
              <span className="block text-[15px] font-extrabold text-gray-900">
                {tab.title}
              </span>
              <span className="mt-1 block pr-2 text-[11px] font-medium leading-tight text-gray-500">
                {tab.subtitle}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <FulfillmentDisableSection
            date={expressDisableDate}
            disableTill={settings?.express_delivery_disable_till}
            enabled={expressDeliveryEnabledNow}
            label="Turn off express delivery"
            saving={savingExpress}
            showForm={showExpressDisableForm}
            time={expressDisableTime}
            availableText="Express delivery is currently available."
            onCancel={() => setShowExpressDisableForm(false)}
            onDateChange={setExpressDisableDate}
            onSave={handleSaveExpressDisableTill}
            onSwitch={handleExpressSwitchChange}
            onTimeChange={setExpressDisableTime}
          />
          <FulfillmentDisableSection
            date={pickupDisableDate}
            disableTill={settings?.pickup_disable_till}
            enabled={pickupEnabledNow}
            label="Turn off pickup"
            saving={savingPickup}
            showForm={showPickupDisableForm}
            time={pickupDisableTime}
            availableText="Pickup is currently available."
            onCancel={() => setShowPickupDisableForm(false)}
            onDateChange={setPickupDisableDate}
            onSave={handleSavePickupDisableTill}
            onSwitch={handlePickupSwitchChange}
            onTimeChange={setPickupDisableTime}
          />
        </div>

      </section>
    </main>
  );
}

function FulfillmentDisableSection({
  availableText,
  date,
  disableTill,
  enabled,
  label,
  onCancel,
  onDateChange,
  onSave,
  onSwitch,
  onTimeChange,
  saving,
  showForm,
  time,
}: {
  availableText: string;
  date: string;
  disableTill?: string | null;
  enabled: boolean;
  label: string;
  onCancel: () => void;
  onDateChange: (value: string) => void;
  onSave: () => void;
  onSwitch: () => void;
  onTimeChange: (value: string) => void;
  saving: boolean;
  showForm: boolean;
  time: string;
}) {
  return (
    <section className="rounded-[20px] border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">{label}</p>
          <p className="mt-1 text-[11px] font-medium leading-4 text-gray-500">
            {enabled ? availableText : `Off till ${formatReadableDateTime(disableTill)}`}
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={onSwitch}
          aria-pressed={enabled}
          className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 shadow-inner transition-colors active:scale-95 disabled:opacity-60 ${
            enabled ? "bg-emerald-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`size-5 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-2xl bg-gray-50 p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold text-gray-500">
                Date
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold text-gray-500">
                Time
              </span>
              <input
                type="time"
                value={time}
                onChange={(event) => onTimeChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold outline-none focus:border-primary"
              />
            </label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !date || !time}
              className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function getPayloadFromSettings(settings: StoreSettings): StoreSettingsPayload {
  return {
    is_open: settings.is_open,
    is_pickup_enabled: settings.is_pickup_enabled,
    pickup_min_order_amount: settings.pickup_min_order_amount,
    pickup_disable_till: settings.pickup_disable_till,
    pickup_min_preparation_minutes: settings.pickup_min_preparation_minutes,
    pickup_max_preparation_minutes: settings.pickup_max_preparation_minutes,
    is_express_delivery_enabled: settings.is_express_delivery_enabled,
    express_delivery_range_km: settings.express_delivery_range_km,
    express_min_order_amount: settings.express_min_order_amount,
    express_delivery_charge: settings.express_delivery_charge,
    express_delivery_disable_till: settings.express_delivery_disable_till,
    express_min_delivery_minutes: settings.express_min_delivery_minutes,
    express_max_delivery_minutes: settings.express_max_delivery_minutes,
    is_scheduled_delivery_enabled: settings.is_scheduled_delivery_enabled,
    scheduled_delivery_range_km: settings.scheduled_delivery_range_km,
    scheduled_min_order_amount: settings.scheduled_min_order_amount,
    scheduled_delivery_charge: settings.scheduled_delivery_charge,
    scheduled_delivery_slots: normalizeSlots(settings.scheduled_delivery_slots),
    scheduled_delivery_disable_till: settings.scheduled_delivery_disable_till,
  };
}

function normalizeSlots(value: StoreSettings["scheduled_delivery_slots"]) {
  return DAYS.reduce<StoreSettingsSlots>((days, day) => {
    const daySlots = value[day];
    days[day] = Array.isArray(daySlots) ? daySlots : [];
    return days;
  }, { cutoff_min: typeof value.cutoff_min === "number" ? value.cutoff_min : 30 });
}

function getNextOpeningDate(store: StoreDetails | null) {
  const now = new Date();
  if (!store) return roundToNextQuarterHour(now);

  const currentDayIndex = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (let offset = 0; offset < 7; offset += 1) {
    const dayIndex = (currentDayIndex + offset) % 7;
    const day = DAYS[dayIndex];
    const hours = store.store_hours[day];
    const slots = hours?.is_closed ? [] : hours?.slots ?? [];

    for (const slot of slots) {
      const openTime = getSlotOpenTime(slot);
      const openMinutes = timeToMinutes(openTime);
      if (offset === 0 && openMinutes <= currentMinutes) continue;

      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + offset);
      const [hour = "0", minute = "0"] = openTime.split(":");
      nextDate.setHours(Number(hour), Number(minute), 0, 0);
      return nextDate;
    }
  }

  return roundToNextQuarterHour(now);
}

function getSlotOpenTime(slot: StoreDetails["store_hours"][string]["slots"][number]) {
  const flexibleSlot = slot as typeof slot & { start?: string };
  return flexibleSlot.open ?? flexibleSlot.start ?? "09:00";
}

function timeToMinutes(value: string) {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

function roundToNextQuarterHour(date: Date) {
  const next = new Date(date);
  next.setMinutes(Math.ceil(next.getMinutes() / 15) * 15, 0, 0);
  return next;
}

function formatDateInput(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatTimeInput(date: Date) {
  return [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ].join(":");
}

function formatReadableDateTime(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCount(value: number | null) {
  return value ?? "-";
}
