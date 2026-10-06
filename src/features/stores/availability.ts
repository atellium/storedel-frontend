import type { StoreSettings, StoreSettingsSlot } from "./types";

type FlexibleSlot = Partial<StoreSettingsSlot> & {
  close?: string;
  end_time?: string;
  start_time?: string;
  to?: string;
};

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function getScheduledDeliveryEndTime(settings: StoreSettings | null) {
  if (!settings?.is_scheduled_delivery_enabled) return null;
  if (settings.is_scheduled_delivery_temporarily_disabled) return null;

  const slots = getSlotsForDate(settings, new Date());
  if (slots.length === 0) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextSlot =
    slots.find((slot) => {
      const start = getSlotStart(slot);
      return start !== null && start >= currentMinutes;
    }) ?? slots[0];
  const end = getSlotEnd(nextSlot);

  return end === null ? null : formatDeliveryTime(end);
}

export function getDeliveryByText(settings: StoreSettings | null) {
  const endTime = getScheduledDeliveryEndTime(settings);

  return endTime ? `Delivery by ${endTime}` : "Delivery unavailable";
}

function getSlotsForDate(settings: StoreSettings, date: Date) {
  const day = DAY_KEYS[date.getDay()];
  const slotsValue = settings.scheduled_delivery_slots[day];

  return Array.isArray(slotsValue) ? (slotsValue as FlexibleSlot[]) : [];
}

function getSlotStart(slot: FlexibleSlot) {
  return getTimeMinutes(slot.start ?? slot.start_time);
}

function getSlotEnd(slot: FlexibleSlot) {
  return getTimeMinutes(slot.end ?? slot.end_time ?? slot.close ?? slot.to);
}

function getTimeMinutes(value?: string) {
  if (!value) return null;

  const [hour = "0", minute = "0"] = value.split(":");
  const hourNumber = Number(hour);
  const minuteNumber = Number(minute);

  if (!Number.isFinite(hourNumber) || !Number.isFinite(minuteNumber)) {
    return null;
  }

  return hourNumber * 60 + minuteNumber;
}

function formatDeliveryTime(totalMinutes: number) {
  const hourNumber = Math.floor(totalMinutes / 60);
  const minuteNumber = totalMinutes % 60;
  const displayHour = hourNumber % 12 || 12;
  const period = hourNumber >= 12 ? "PM" : "AM";

  return `${displayHour}:${String(minuteNumber).padStart(2, "0")} ${period}`;
}
