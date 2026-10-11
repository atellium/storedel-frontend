"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BottomSheetModal } from "@/components/modals";
import { AuthGuard } from "@/features/auth/auth-guard";
import {
  getMyStoreCustomer,
  getMyStoreCustomers,
  saveMyStoreCustomer,
} from "./stores-service";
import type {
  StoreCustomer,
  StoreCustomerPayload,
  StoreCustomersResponse,
} from "./types";

type CustomerFormValues = {
  scheduled_min_order_amount: string;
  scheduled_delivery_charge: string;
  express_min_order_amount: string;
  express_delivery_charge: string;
  pickup_min_order_amount: string;
  note: string;
};

const emptyCustomerForm: CustomerFormValues = {
  scheduled_min_order_amount: "",
  scheduled_delivery_charge: "",
  express_min_order_amount: "",
  express_delivery_charge: "",
  pickup_min_order_amount: "",
  note: "",
};

export function StoreCustomersView({ storeSlug }: { storeSlug: string }) {
  return (
    <AuthGuard>
      <StoreCustomersContent storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function StoreCustomersContent({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const [data, setData] = useState<StoreCustomersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  useEffect(() => {
    let isMounted = true;

    getMyStoreCustomers(storeSlug, page)
      .then((nextData) => {
        if (!isMounted) return;
        setData(nextData);
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [page, storeSlug]);

  const customers = useMemo(() => data?.results ?? [], [data]);
  const pagination = data?.pagination;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] pb-20 text-gray-900">
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
          <h1 className="text-base font-bold text-gray-900">Customers</h1>
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-primary">
            <i className="fa-solid fa-users text-sm" aria-hidden="true" />
          </span>
        </div>
      </header>

      <section className="px-4 py-6">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Store Manager
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900">
            Customers
          </h2>
        </div>

        {status === "loading" && (
          <StatusPanel text="Loading customers..." />
        )}

        {status === "error" && (
          <StatusPanel tone="error" text="Could not load customers." />
        )}

        {status === "idle" && (
          <div className="space-y-3">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  storeSlug={storeSlug}
                />
              ))
            ) : (
              <StatusPanel text="No customers found." />
            )}

            {pagination && pagination.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-between rounded-[20px] border border-gray-100 bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <button
                  type="button"
                  onClick={() => {
                    setStatus("loading");
                    setPage(pagination.previous_page ?? page - 1);
                  }}
                  disabled={!pagination.previous && !pagination.has_previous}
                  className="h-10 min-w-[96px] rounded-xl border border-gray-200 bg-gray-50 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-700 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Page <span className="text-gray-900">{pagination.page}</span> of {pagination.total_pages}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStatus("loading");
                    setPage(pagination.next_page ?? page + 1);
                  }}
                  disabled={!pagination.next && !pagination.has_next}
                  className="h-10 min-w-[96px] rounded-xl bg-primary px-4 text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function CustomerRow({
  customer,
  storeSlug,
}: {
  customer: StoreCustomer;
  storeSlug: string;
}) {
  return (
    <Link
      href={`/${storeSlug}/manage/customers/${customer.id}`}
      className="block rounded-[16px] border border-gray-100 bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[14px] font-extrabold text-gray-900">
              {customer.full_name}
            </h3>
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              customer.is_active
                ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20"
                : "bg-gray-50 text-gray-500 ring-1 ring-gray-200"
            }`}>
              {customer.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-gray-500">
            {customer.order_count ?? 0} orders <span className="mx-1 text-gray-300">&middot;</span> {formatPrice(customer.total_amount ?? 0)}
          </p>
        </div>
        <i className="fa-solid fa-chevron-right shrink-0 text-[11px] text-gray-300" aria-hidden="true" />
      </div>
    </Link>
  );
}

export function StoreCustomerDetailsView({
  customerId,
  storeSlug,
}: {
  customerId: string;
  storeSlug: string;
}) {
  return (
    <AuthGuard>
      <StoreCustomerDetailsContent customerId={customerId} storeSlug={storeSlug} />
    </AuthGuard>
  );
}

function StoreCustomerDetailsContent({
  customerId,
  storeSlug,
}: {
  customerId: string;
  storeSlug: string;
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState<StoreCustomer | null>(null);
  const [form, setForm] = useState<CustomerFormValues>(emptyCustomerForm);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getMyStoreCustomer(storeSlug, customerId)
      .then((nextCustomer) => {
        if (!isMounted) return;
        setCustomer(nextCustomer);
        setForm(getFormFromCustomer(nextCustomer));
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [customerId, storeSlug]);

  const openEditSheet = () => {
    if (!customer) return;
    setForm(getFormFromCustomer(customer));
    setMessage(null);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    if (saving) return;
    setSheetOpen(false);
    setMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customer || saving) return;

    setSaving(true);
    setMessage(null);

    try {
      const savedCustomer = await saveMyStoreCustomer(
        storeSlug,
        customer.id,
        getCustomerPayload(form, customer),
      );
      setCustomer(savedCustomer);
      setForm(getFormFromCustomer(savedCustomer));
      setSheetOpen(false);
    } catch {
      setMessage("Could not save customer settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] pb-20 text-gray-900">
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
          <h1 className="truncate text-base font-bold text-gray-900">
            {customer?.full_name ?? "Customer"}
          </h1>
          <button
            type="button"
            onClick={openEditSheet}
            disabled={!customer}
            aria-label="Edit customer"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-primary transition active:scale-95 disabled:opacity-50"
          >
            <i className="fa-solid fa-pencil text-sm" aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="px-4 py-6">
        {status === "loading" && <StatusPanel text="Loading customer..." />}
        {status === "error" && <StatusPanel tone="error" text="Could not load customer." />}
        {status === "idle" && customer && (
          <div className="space-y-4">
            <section className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Customer
                  </p>
                  <h2 className="mt-1 truncate text-2xl font-black text-gray-900">
                    {customer.full_name}
                  </h2>
                </div>
                <span className={`shrink-0 rounded px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${
                  customer.is_active
                    ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20"
                    : "bg-gray-50 text-gray-500 ring-1 ring-gray-200"
                }`}>
                  {customer.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <CustomerMetric label="Phone" value={customer.phone} />
                <CustomerMetric label="Email" value={customer.email ?? "-"} />
                <CustomerMetric label="Orders" value={String(customer.order_count ?? 0)} />
                <CustomerMetric label="Total" value={formatPrice(customer.total_amount ?? 0)} />
              </div>
            </section>

            <section className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h3 className="text-[15px] font-extrabold text-gray-900">Delivery Rules</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <CustomerMetric label="Scheduled minimum" value={formatNullablePrice(customer.scheduled_min_order_amount)} />
                <CustomerMetric label="Scheduled charge" value={formatNullablePrice(customer.scheduled_delivery_charge)} />
                <CustomerMetric label="Express minimum" value={formatNullablePrice(customer.express_min_order_amount)} />
                <CustomerMetric label="Express charge" value={formatNullablePrice(customer.express_delivery_charge)} />
                <CustomerMetric label="Pickup minimum" value={formatNullablePrice(customer.pickup_min_order_amount)} />
                <CustomerMetric label="Cancel percent" value={formatNullablePercent(customer.cancellation_percentage)} />
              </div>
            </section>

            {customer.note && (
              <section className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <h3 className="text-[15px] font-extrabold text-gray-900">Note</h3>
                <p className="mt-2 text-[13px] font-medium leading-relaxed text-gray-600">
                  {customer.note}
                </p>
              </section>
            )}
          </div>
        )}
      </section>

      <BottomSheetModal
        open={sheetOpen}
        onClose={closeSheet}
        title={customer ? `Edit ${customer.full_name}` : "Edit customer"}
      >
        <CustomerSettingsForm
          customer={customer}
          form={form}
          message={message}
          onCancel={closeSheet}
          onChange={(field, value) =>
            setForm((current) => ({ ...current, [field]: value }))
          }
          onSubmit={handleSubmit}
          saving={saving}
        />
      </BottomSheetModal>
    </main>
  );
}

function CustomerMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2">
      <span className="block text-[9px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <span className="mt-0.5 block truncate text-[12px] font-extrabold text-gray-900">
        {value}
      </span>
    </div>
  );
}

function CustomerSettingsForm({
  customer,
  form,
  message,
  onCancel,
  onChange,
  onSubmit,
  saving,
}: {
  customer: StoreCustomer | null;
  form: CustomerFormValues;
  message: string | null;
  onCancel: () => void;
  onChange: (field: keyof CustomerFormValues, value: string | boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 px-3 pb-6 pt-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
          Customer Settings
        </p>
        <h2 className="mt-1 text-2xl font-black text-gray-900">
          {customer?.full_name ?? "Customer"}
        </h2>
      </div>

      <div className="grid gap-3 rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="grid grid-cols-2 gap-3">
          <CustomerField label="Scheduled minimum order amount" inputMode="decimal" value={form.scheduled_min_order_amount} onChange={(value) => onChange("scheduled_min_order_amount", numericInput(value))} />
          <CustomerField label="Scheduled delivery charge" inputMode="decimal" value={form.scheduled_delivery_charge} onChange={(value) => onChange("scheduled_delivery_charge", numericInput(value))} />
          <CustomerField label="Express minimum order amount" inputMode="decimal" value={form.express_min_order_amount} onChange={(value) => onChange("express_min_order_amount", numericInput(value))} />
          <CustomerField label="Express delivery charge" inputMode="decimal" value={form.express_delivery_charge} onChange={(value) => onChange("express_delivery_charge", numericInput(value))} />
          <CustomerField label="Pickup minimum order amount" inputMode="decimal" value={form.pickup_min_order_amount} onChange={(value) => onChange("pickup_min_order_amount", numericInput(value))} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">Note</span>
          <textarea
            value={form.note}
            onChange={(event) => onChange("note", event.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-[13px] font-semibold text-gray-900 outline-none focus:border-primary/50 focus:bg-white"
          />
        </label>
      </div>

      {message && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-600">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onCancel} disabled={saving} className="h-12 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 disabled:opacity-60">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="h-12 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function CustomerField({
  inputMode,
  label,
  onChange,
  placeholder,
  value,
}: {
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </span>
      <input
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-[13px] font-semibold text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary/50 focus:bg-white"
      />
    </label>
  );
}

function StatusPanel({ text, tone = "default" }: { text: string; tone?: "default" | "error" }) {
  return (
    <div className={`rounded-[20px] border px-4 py-8 text-center text-sm font-bold shadow-sm ${
      tone === "error"
        ? "border-red-100 bg-red-50 text-red-500"
        : "border-gray-100 bg-white text-gray-500"
    }`}>
      {text}
    </div>
  );
}

function getFormFromCustomer(customer: StoreCustomer): CustomerFormValues {
  return {
    scheduled_min_order_amount: formatInputNumber(customer.scheduled_min_order_amount),
    scheduled_delivery_charge: formatInputNumber(customer.scheduled_delivery_charge),
    express_min_order_amount: formatInputNumber(customer.express_min_order_amount),
    express_delivery_charge: formatInputNumber(customer.express_delivery_charge),
    pickup_min_order_amount: formatInputNumber(customer.pickup_min_order_amount),
    note: customer.note ?? "",
  };
}

function getCustomerPayload(
  form: CustomerFormValues,
  customer: StoreCustomer,
): StoreCustomerPayload {
  return {
    scheduled_min_order_amount: toNullableNumber(form.scheduled_min_order_amount),
    scheduled_delivery_charge: toNullableNumber(form.scheduled_delivery_charge),
    express_min_order_amount: toNullableNumber(form.express_min_order_amount),
    express_delivery_charge: toNullableNumber(form.express_delivery_charge),
    pickup_min_order_amount: toNullableNumber(form.pickup_min_order_amount),
    cancellation_percentage: customer.cancellation_percentage,
    settings: customer.settings ?? {},
    note: form.note.trim(),
    is_active: customer.is_active,
  };
}

function numericInput(value: string) {
  return value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

function toNullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numberValue = Number(trimmed);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatInputNumber(value?: number | null) {
  return value === null || value === undefined ? "" : String(value);
}

function formatNullablePrice(value?: number | null) {
  return value === null || value === undefined ? "-" : formatPrice(value);
}

function formatNullablePercent(value?: number | null) {
  return value === null || value === undefined ? "-" : `${value}%`;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(price);
}
