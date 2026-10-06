"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/features/auth/auth-guard";
import { useAppDispatch } from "@/store/hooks";
import { showToast } from "@/store/slices/ui-slice";
import {
  getStoreSettings,
  saveMyStoreSettings,
} from "./stores-service";
import type {
  StoreSettings,
  StoreSettingsPayload,
  StoreSettingsSlot,
  StoreSettingsSlots,
} from "./types";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const emptySettings: StoreSettingsPayload = {
  is_open: true,
  is_pickup_enabled: true,
  is_express_delivery_enabled: true,
  is_scheduled_delivery_enabled: true,
  scheduled_delivery_range_km: "5.00",
  scheduled_min_order_amount: 100,
  scheduled_delivery_charge: 0,
  scheduled_delivery_slots: createEmptyDaySlots(),
  scheduled_delivery_disable_till: null,
  express_delivery_range_km: "3.00",
  express_min_order_amount: 100,
  express_delivery_charge: 0,
  express_delivery_disable_till: null,
  express_min_delivery_minutes: 30,
  express_max_delivery_minutes: 45,
  pickup_min_order_amount: 0,
  pickup_disable_till: null,
  pickup_min_preparation_minutes: 15,
  pickup_max_preparation_minutes: 30,
};

export function StorePickupDeliverySettingsView({
  storeSlug,
}: {
  storeSlug: string;
}) {
  return (
    <AuthGuard>
      <StorePickupDeliverySettingsContent storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function StorePickupDeliverySettingsContent({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<StoreSettingsPayload>(emptySettings);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getStoreSettings(storeSlug)
      .then((settings) => {
        if (!isMounted) return;
        if (settings) {
          setForm(getPayloadFromSettings(settings));
        }
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

  const updateField = (
    field: keyof StoreSettingsPayload,
    value:
      | string
      | number
      | boolean
      | null
      | StoreSettingsPayload["scheduled_delivery_slots"],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      const savedSettings = await saveMyStoreSettings(storeSlug, form);
      setForm(getPayloadFromSettings(savedSettings));
      dispatch(
        showToast({
          title: "Settings saved",
          message: "Your store settings were updated successfully.",
          type: "success",
        }),
      );
    } catch {
      dispatch(
        showToast({
          title: "Could not save settings",
          message: "Please check your connection and try again.",
          type: "error",
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900">
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
            Pickup & delivery
          </h1>

          <Link
            href={`/${storeSlug}/manage/dashboard`}
            aria-label="Dashboard"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-primary transition active:scale-95"
          >
            <i className="fa-solid fa-chart-line text-sm" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="px-4 py-6">
        {status === "loading" && (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-6 text-center text-sm font-medium text-gray-500 shadow-sm">
            Loading settings...
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-6 text-center text-sm font-medium text-red-500 shadow-sm">
            Could not load settings.
          </div>
        )}

        {status === "idle" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-28">
            <div className="order-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                Store Controls
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
                Delivery & Pickup
              </h2>
            </div>

            {form.is_pickup_enabled && (
              <section className="order-2 overflow-hidden rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="mb-4 text-[15px] font-extrabold text-gray-900">Store Pickup</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <NumberField
                      label="Min order (in Rs)"
                      value={form.pickup_min_order_amount}
                      onChange={(value) => updateField("pickup_min_order_amount", value)}
                    />
                  </div>
                  <NumberField
                    label="Min prep (mins)"
                    value={form.pickup_min_preparation_minutes}
                    onChange={(value) =>
                      updateField("pickup_min_preparation_minutes", value)
                    }
                  />
                  <NumberField
                    label="Max prep (mins)"
                    value={form.pickup_max_preparation_minutes}
                    onChange={(value) =>
                      updateField("pickup_max_preparation_minutes", value)
                    }
                  />
                </div>
              </section>
            )}

            {form.is_express_delivery_enabled && (
            <section className="order-4 overflow-hidden rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h3 className="mb-4 text-[15px] font-extrabold text-gray-900">Express Delivery</h3>
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Range (in km)"
                  value={form.express_delivery_range_km}
                  onChange={(value) =>
                    updateField("express_delivery_range_km", value)
                  }
                />
                <NumberField
                  label="Min order (in ₹)"
                  value={form.express_min_order_amount}
                  onChange={(value) =>
                    updateField("express_min_order_amount", value)
                  }
                />
                <NumberField
                  label="Charge (in ₹)"
                  value={form.express_delivery_charge}
                  onChange={(value) =>
                    updateField("express_delivery_charge", value)
                  }
                />
                <div className="hidden sm:block" /> {/* Spacer */}
                <NumberField
                  label="Min time (mins)"
                  value={form.express_min_delivery_minutes}
                  onChange={(value) =>
                    updateField("express_min_delivery_minutes", value)
                  }
                />
                <NumberField
                  label="Max time (mins)"
                  value={form.express_max_delivery_minutes}
                  onChange={(value) =>
                    updateField("express_max_delivery_minutes", value)
                  }
                />
              </div>
            </section>
            )}

            {form.is_scheduled_delivery_enabled && (
            <section className="order-3 overflow-hidden rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h3 className="mb-4 text-[15px] font-extrabold text-gray-900">Scheduled Delivery</h3>
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Range (in km)"
                  value={form.scheduled_delivery_range_km}
                  onChange={(value) =>
                    updateField("scheduled_delivery_range_km", value)
                  }
                />
                <NumberField
                  label="Min order (in ₹)"
                  value={form.scheduled_min_order_amount}
                  onChange={(value) =>
                    updateField("scheduled_min_order_amount", value)
                  }
                />
                <div className="col-span-2 sm:col-span-1">
                  <NumberField
                    label="Charge (in ₹)"
                    value={form.scheduled_delivery_charge}
                    onChange={(value) =>
                      updateField("scheduled_delivery_charge", value)
                    }
                  />
                </div>
              </div>

              <div className="mt-4">
                <ScheduledPauseCard
                  value={form.scheduled_delivery_disable_till}
                  onChange={(value) =>
                    updateField("scheduled_delivery_disable_till", value)
                  }
                />
              </div>
              <div className="mt-4">
                <ScheduleEditor
                  slots={form.scheduled_delivery_slots}
                  onChange={(slots) => updateField("scheduled_delivery_slots", slots)}
                />
              </div>
            </section>
            )}

            <section className="hidden">
              <h3 className="mb-4 text-[15px] font-extrabold text-gray-900">Store Pickup</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <NumberField
                    label="Min order (in ₹)"
                    value={form.pickup_min_order_amount}
                    onChange={(value) => updateField("pickup_min_order_amount", value)}
                  />
                </div>
                <NumberField
                  label="Min prep (mins)"
                  value={form.pickup_min_preparation_minutes}
                  onChange={(value) =>
                    updateField("pickup_min_preparation_minutes", value)
                  }
                />
                <NumberField
                  label="Max prep (mins)"
                  value={form.pickup_max_preparation_minutes}
                  onChange={(value) =>
                    updateField("pickup_max_preparation_minutes", value)
                  }
                />
              </div>
            </section>

            <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[640px] border-t border-gray-100 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
              <button
                type="submit"
                disabled={saving}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              >
                {saving ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
      />
    </label>
  );
}

function NumberField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
      />
    </label>
  );
}

function ScheduledPauseCard({
  onChange,
  value,
}: {
  onChange: (value: string | null) => void;
  value: string | null;
}) {
  const dateValue = toDateInputValue(value);
  const timeValue = toTimeInputValue(value);

  const updateDateTime = (date: string, time: string) => {
    if (!date && !time) {
      onChange(null);
      return;
    }
    if (!date || !time) return;
    onChange(new Date(`${date}T${time}`).toISOString());
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
      <h4 className="text-[13px] font-bold text-gray-900">
        Pause Scheduled Delivery
      </h4>
      <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-500">
        Scheduled delivery will remain unavailable until the selected date and time. Leave blank to keep it available.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Date</span>
          <input
            type="date"
            value={dateValue}
            onChange={(event) => updateDateTime(event.target.value, timeValue)}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-900 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Time</span>
          <input
            type="time"
            value={timeValue}
            onChange={(event) => updateDateTime(dateValue, event.target.value)}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] font-semibold text-gray-900 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
        </label>
      </div>
      {(dateValue || timeValue) && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-gray-200 bg-white text-xs font-bold uppercase tracking-wider text-gray-700 shadow-sm transition active:scale-[0.98]"
        >
          Clear Pause
        </button>
      )}
    </div>
  );
}

function ScheduleEditor({
  onChange,
  slots,
}: {
  onChange: (slots: StoreSettingsPayload["scheduled_delivery_slots"]) => void;
  slots: StoreSettingsPayload["scheduled_delivery_slots"];
}) {
  const [open, setOpen] = useState(false);

  const updateSlot = (
    day: string,
    index: number,
    field: keyof StoreSettingsSlot,
    value: string,
  ) => {
    const daySlots = getDaySlots(slots, day);
    onChange({
      ...slots,
      [day]: daySlots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: value } : slot,
      ),
    });
  };

  const addSlot = (day: string) => {
    const daySlots = getDaySlots(slots, day);
    onChange({
      ...slots,
      [day]: [...daySlots, { start: "09:00", end: "12:00" }],
    });
  };

  const removeSlot = (day: string, index: number) => {
    const daySlots = getDaySlots(slots, day);
    onChange({
      ...slots,
      [day]: daySlots.filter((_, slotIndex) => slotIndex !== index),
    });
  };

  const copyAboveDay = (day: string) => {
    const dayIndex = DAYS.indexOf(day);
    if (dayIndex <= 0) return;
    const aboveDay = DAYS[dayIndex - 1];
    onChange({
      ...slots,
      [day]: getDaySlots(slots, aboveDay).map((slot) => ({ ...slot })),
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 bg-gray-50/50 px-4 py-4 text-left transition hover:bg-gray-50 active:bg-gray-100"
      >
        <span className="min-w-0">
          <span className="block text-[14px] font-bold text-gray-900">
            Delivery Slots configuration
          </span>
          <span className="mt-0.5 block text-[11px] font-medium text-gray-500">
            {getTotalSlotCount(slots)} slots active
          </span>
        </span>
        <div className="flex size-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
          <i
            className={`fa-solid fa-chevron-down text-[10px] text-gray-500 transition-transform duration-300 ${open ? "rotate-180" : ""
              }`}
            aria-hidden="true"
          />
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-gray-100 p-4">
          <NumberField
            label="Slot Cutoff (mins before)"
            value={Number(slots.cutoff_min ?? 0)}
            onChange={(value) => onChange({ ...slots, cutoff_min: value })}
          />
          <div className="space-y-3">
            {DAYS.map((day, dayIndex) => {
              const daySlots = getDaySlots(slots, day);

              return (
                <div key={day} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold capitalize text-gray-900">{day}</h4>
                    <div className="flex items-center gap-2">
                      {dayIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => copyAboveDay(day)}
                          className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 shadow-sm ring-1 ring-gray-200 transition active:scale-95"
                        >
                          Copy Above
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => addSlot(day)}
                        className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary transition hover:bg-primary/20 active:scale-95"
                      >
                        + Add Slot
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {daySlots.length === 0 && (
                      <p className="text-[11px] font-medium text-gray-400">No active slots for {day}.</p>
                    )}
                    {daySlots.map((slot, index) => (
                      <div key={`${day}-${index}`} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(event) =>
                            updateSlot(day, index, "start", event.target.value)
                          }
                          className="h-10 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-900 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                        />
                        <span className="text-gray-400 text-xs font-bold">-</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(event) =>
                            updateSlot(day, index, "end", event.target.value)
                          }
                          className="h-10 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-900 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeSlot(day, index)}
                          aria-label="Remove slot"
                          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100 active:scale-95"
                        >
                          <i className="fa-solid fa-trash text-xs" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getDaySlots(slots: StoreSettingsPayload["scheduled_delivery_slots"], day: string) {
  const daySlots = slots[day];
  return Array.isArray(daySlots) ? daySlots : [];
}

function getTotalSlotCount(slots: StoreSettingsPayload["scheduled_delivery_slots"]) {
  return DAYS.reduce((total, day) => total + getDaySlots(slots, day).length, 0);
}

function getPayloadFromSettings(settings: StoreSettings): StoreSettingsPayload {
  return {
    is_open: settings.is_open,
    is_pickup_enabled: settings.is_pickup_enabled,
    is_express_delivery_enabled: settings.is_express_delivery_enabled,
    is_scheduled_delivery_enabled: settings.is_scheduled_delivery_enabled,
    scheduled_delivery_range_km: settings.scheduled_delivery_range_km,
    scheduled_min_order_amount: settings.scheduled_min_order_amount,
    scheduled_delivery_charge: settings.scheduled_delivery_charge,
    scheduled_delivery_slots: normalizeSlots(settings.scheduled_delivery_slots),
    scheduled_delivery_disable_till: settings.scheduled_delivery_disable_till,
    express_delivery_range_km: settings.express_delivery_range_km,
    express_min_order_amount: settings.express_min_order_amount,
    express_delivery_charge: settings.express_delivery_charge,
    express_delivery_disable_till: settings.express_delivery_disable_till,
    express_min_delivery_minutes: settings.express_min_delivery_minutes,
    express_max_delivery_minutes: settings.express_max_delivery_minutes,
    pickup_min_order_amount: settings.pickup_min_order_amount,
    pickup_disable_till: settings.pickup_disable_till,
    pickup_min_preparation_minutes: settings.pickup_min_preparation_minutes,
    pickup_max_preparation_minutes: settings.pickup_max_preparation_minutes,
  };
}

function normalizeSlots(value: StoreSettings["scheduled_delivery_slots"]) {
  const slots = createEmptyDaySlots();
  slots.cutoff_min =
    typeof value.cutoff_min === "number" ? value.cutoff_min : slots.cutoff_min;

  for (const day of DAYS) {
    const daySlots = value[day];
    slots[day] = Array.isArray(daySlots) ? daySlots : [];
  }

  return slots;
}

function createEmptyDaySlots(): StoreSettingsSlots {
  return DAYS.reduce<StoreSettingsSlots>((days, day) => {
    days[day] = [];
    return days;
  }, { cutoff_min: 30 });
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function toTimeInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(11, 16);
}
