"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomSheetModal } from "@/components/modals";
import {
  createUserAddress,
  getCitiesByPincodePrefix,
  getUserAddresses,
  updateUserAddress,
  type UserAddress,
  type UserAddressCity,
  type UserAddressPayload,
} from "@/features/addresses/address-service";
import { AuthGuard } from "@/features/auth/auth-guard";
import { useAppSelector } from "@/store/hooks";

type AddressFormValues = {
  address_type: string;
  custom_label: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  landmark: string;
  city_id: string;
  postal_code: string;
  is_default: boolean;
};

const emptyForm: AddressFormValues = {
  address_type: "home",
  custom_label: "",
  recipient_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  landmark: "",
  city_id: "",
  postal_code: "",
  is_default: false,
};

export default function AddressPage() {
  return (
    <AuthGuard>
      <AddressContent />
    </AuthGuard>
  );
}

function AddressContent() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [mode, setMode] = useState<"add" | "edit" | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<UserAddress | null>(null);
  const [form, setForm] = useState<AddressFormValues>(emptyForm);
  const [usingMyDetails, setUsingMyDetails] = useState(false);
  const [cityOptions, setCityOptions] = useState<UserAddressCity[]>([]);
  const [cityStatus, setCityStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const user = useAppSelector((state) => state.auth.user);
  const postalCodePrefix = form.postal_code.trim().slice(0, 3);

  useEffect(() => {
    let isMounted = true;

    getUserAddresses()
      .then((nextAddresses) => {
        if (!isMounted) return;
        setAddresses(nextAddresses);
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (postalCodePrefix.length < 3) {
      return;
    }

    let isMounted = true;

    getCitiesByPincodePrefix(postalCodePrefix)
      .then((cities) => {
        if (!isMounted) return;
        setCityOptions(cities);
        setCityStatus("idle");
        setForm((current) => ({
          ...current,
          city_id:
            cities.length === 1
              ? String(cities[0].id)
              : cities.some((city) => String(city.id) === current.city_id)
                ? current.city_id
                : "",
        }));
      })
      .catch(() => {
        if (!isMounted) return;
        setCityOptions([]);
        setCityStatus("error");
        setForm((current) => ({ ...current, city_id: "" }));
      });

    return () => {
      isMounted = false;
    };
  }, [postalCodePrefix]);

  const selectedCity = useMemo(
    () => cityOptions.find((city) => String(city.id) === form.city_id) ?? null,
    [cityOptions, form.city_id],
  );

  const openAddSheet = () => {
    setForm(emptyForm);
    setUsingMyDetails(false);
    setCityOptions([]);
    setCityStatus("idle");
    setEditingAddressId(null);
    setMessage(null);
    setMode("add");
  };

  const openEditSheet = (address: UserAddress) => {
    setForm(getFormFromAddress(address));
    setUsingMyDetails(false);
    setCityOptions([address.city]);
    setCityStatus("idle");
    setEditingAddressId(address.id);
    setMessage(null);
    setMode("edit");
  };

  const closeSheet = () => {
    setMode(null);
    setEditingAddressId(null);
    setPendingAction(null);
  };

  const openDeleteSheet = (address: UserAddress) => {
    setDeletingAddress(address);
    setMessage(null);
  };

  const closeDeleteSheet = () => {
    setDeletingAddress(null);
    setPendingAction(null);
  };

  const handleDelete = async () => {
    if (!deletingAddress) return;

    setPendingAction(deletingAddress.id);
    setMessage(null);

    try {
      await updateUserAddress(deletingAddress.id, {
        ...getPayloadFromForm(getFormFromAddress(deletingAddress)),
        is_active: false,
      });
      setAddresses((current) =>
        current.filter((address) => address.id !== deletingAddress.id),
      );
      closeDeleteSheet();
    } catch {
      setMessage("Could not delete address.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.city_id) {
      setMessage("Select a city before saving.");
      return;
    }

    setPendingAction("save");
    setMessage(null);

    try {
      const payload = getPayloadFromForm(form);
      if (mode !== "edit") {
        console.log("Add address payload", payload);
      }
      const savedAddress =
        mode === "edit" && editingAddressId
          ? await updateUserAddress(editingAddressId, payload)
          : await createUserAddress(payload);

      setAddresses((current) => {
        if (mode === "edit") {
          return current.map((address) =>
            address.id === savedAddress.id ? savedAddress : address,
          );
        }

        return [savedAddress, ...current];
      });
      closeSheet();
      setMessage(mode === "edit" ? "Address updated." : "Address added.");
    } catch {
      setMessage("Could not save address.");
    } finally {
      setPendingAction(null);
    }
  };

  const updateField = (
    field: keyof AddressFormValues,
    value: string | boolean,
  ) => {
    const nextValue =
      field === "postal_code" && typeof value === "string"
        ? value.replace(/\D/g, "").slice(0, 6)
        : value;

    if (field === "postal_code" && typeof nextValue === "string") {
      setForm((current) => {
        const currentPrefix = current.postal_code.trim().slice(0, 3);
        const nextPrefix = nextValue.trim().slice(0, 3);

        if (nextValue.trim().length < 3) {
          setCityOptions([]);
          setCityStatus("idle");
          return { ...current, postal_code: nextValue, city_id: "" };
        }

        if (nextPrefix !== currentPrefix) {
          setCityStatus("loading");
        }

        return { ...current, postal_code: nextValue };
      });
      return;
    }

    setForm((current) => ({ ...current, [field]: nextValue }));
  };

  const useMyDetails = (checked: boolean) => {
    setUsingMyDetails(checked);
    if (!checked) return;
    setForm((current) => ({
      ...current,
      recipient_name: user?.full_name ?? current.recipient_name,
      phone: getPhoneWithoutCountryCode(user?.phone) || current.phone,
    }));
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="grid h-15 grid-cols-[auto_1fr_auto] items-center gap-3 px-3">
          <Link
            href="/profile"
            aria-label="Back to profile"
            className="inline-flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          </Link>
          <h1 className="text-center text-lg font-bold">Addresses</h1>
          <button
            type="button"
            onClick={openAddSheet}
            aria-label="Add new address"
            className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-white shadow-sm transition active:scale-95"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="px-3 py-5">
        {message && (
          <div className="mb-3 rounded-[20px] border border-gray-100 bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm">
            {message}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Saved places</p>
            <h2 className="mt-1 text-2xl font-bold">Available addresses</h2>
          </div>
          <button
            type="button"
            onClick={openAddSheet}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
          >
            <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
            Add new
          </button>
        </div>

        {status === "loading" && (
          <div className="mt-4 rounded-[20px] border border-gray-100 bg-white px-4 py-5 text-sm font-semibold text-gray-500 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            Loading addresses...
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 rounded-[20px] border border-gray-100 bg-white px-4 py-5 text-sm font-semibold text-gray-500 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            Could not load addresses.
          </div>
        )}

        {status === "idle" && addresses.length === 0 && (
          <div className="mt-4 rounded-[20px] border border-gray-100 bg-white px-4 py-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <p className="text-sm font-semibold text-secondary">
              No addresses saved yet.
            </p>
            <button
              type="button"
              onClick={openAddSheet}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
            >
              Add new address
            </button>
          </div>
        )}

        {status === "idle" && addresses.length > 0 && (
          <div className="mt-4 space-y-3">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                deleting={pendingAction === address.id}
                onDelete={() => openDeleteSheet(address)}
                onEdit={() => openEditSheet(address)}
              />
            ))}
          </div>
        )}
      </section>

      <BottomSheetModal
        open={mode !== null}
        onClose={closeSheet}
        title={mode === "edit" ? "Edit address" : "Add address"}
      >
        <AddressForm
          cityOptions={cityOptions}
          cityStatus={cityStatus}
          form={form}
          mode={mode ?? "add"}
          onCancel={closeSheet}
          onChange={updateField}
          onSubmit={handleSubmit}
          onUseMyDetails={useMyDetails}
          pending={pendingAction === "save"}
          selectedCity={selectedCity}
          usingMyDetails={usingMyDetails}
          hideUseMyDetails={mode === "edit" && phonesMatch(form.phone, user?.phone)}
          userHasDetails={Boolean(user?.full_name || user?.phone)}
        />
      </BottomSheetModal>

      <BottomSheetModal
        open={deletingAddress !== null}
        onClose={closeDeleteSheet}
        title="Delete address"
      >
        <DeleteAddressConfirmation
          address={deletingAddress}
          deleting={Boolean(deletingAddress && pendingAction === deletingAddress.id)}
          onCancel={closeDeleteSheet}
          onDelete={handleDelete}
        />
      </BottomSheetModal>
    </main>
  );
}

function DeleteAddressConfirmation({
  address,
  deleting,
  onCancel,
  onDelete,
}: {
  address: UserAddress | null;
  deleting: boolean;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="px-4 pb-5 pt-4">
      <h2 className="text-xl font-bold text-gray-900">Delete this address?</h2>
      <p className="mt-2 text-sm font-medium leading-5 text-secondary">
        {address?.full_address ?? "This saved address"} will be removed from your
        account.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-700 shadow-sm transition active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="h-12 rounded-xl bg-red-500 px-4 text-sm font-bold text-white disabled:opacity-70"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}

function AddressForm({
  cityOptions,
  cityStatus,
  form,
  mode,
  onCancel,
  onChange,
  onSubmit,
  onUseMyDetails,
  pending,
  hideUseMyDetails,
  selectedCity,
  usingMyDetails,
  userHasDetails,
}: {
  cityOptions: UserAddressCity[];
  cityStatus: "idle" | "loading" | "error";
  form: AddressFormValues;
  mode: "add" | "edit";
  onCancel: () => void;
  onChange: (field: keyof AddressFormValues, value: string | boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onUseMyDetails: (checked: boolean) => void;
  pending: boolean;
  hideUseMyDetails: boolean;
  selectedCity: UserAddressCity | null;
  usingMyDetails: boolean;
  userHasDetails: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 px-4 pb-5 pt-4">
      <div>
        <p className="text-sm font-semibold text-primary">
          {mode === "edit" ? "Edit address" : "New address"}
        </p>
        <h2 className="mt-1 text-2xl font-bold">
          {mode === "edit" ? "Update delivery address" : "Add delivery address"}
        </h2>
      </div>

      <div className="grid gap-3 rounded-[20px] border border-gray-100 bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-bold text-gray-900">Address details</h3>
        <Field
          label="Address line 1"
          placeholder="House number, building, street"
          required
          value={form.address_line1}
          onChange={(value) => onChange("address_line1", value)}
        />
        <Field
          label="Address line 2"
          placeholder="Area, colony, apartment"
          value={form.address_line2}
          onChange={(value) => onChange("address_line2", value)}
        />
        <Field
          label="Landmark"
          placeholder="Nearby landmark"
          value={form.landmark}
          onChange={(value) => onChange("landmark", value)}
        />
        <Field
          label="Postal code"
          maxLength={6}
          placeholder="700001"
          required
          inputMode="numeric"
          value={form.postal_code}
          onChange={(value) => onChange("postal_code", value)}
        />
        <CityField
          cityOptions={cityOptions}
          cityStatus={cityStatus}
          selectedCityId={form.city_id}
          onChange={(value) => onChange("city_id", value)}
        />
        <Field
          label="State"
          placeholder="State"
          value={selectedCity?.state.name ?? ""}
          disabled
          onChange={() => undefined}
        />
        <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(event) => onChange("is_default", event.target.checked)}
            className="size-4 accent-primary"
          />
          Set as default
        </label>
        <AddressTypeTabs
          value={form.address_type}
          onChange={(value) => onChange("address_type", value)}
        />
        {form.address_type === "other" && (
          <Field
            label="Custom label"
            placeholder="Parents, office, weekend home"
            value={form.custom_label}
            onChange={(value) => onChange("custom_label", value)}
          />
        )}
      </div>

      <div className="grid gap-3 rounded-[20px] border border-gray-100 bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <h3 className="text-sm font-bold text-gray-900">Contact details</h3>
        {!hideUseMyDetails && (
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={usingMyDetails}
              onChange={(event) => onUseMyDetails(event.target.checked)}
              disabled={!userHasDetails}
              className="size-4 accent-primary"
            />
            Use my name and phone
          </label>
        )}
        <Field
          disabled={usingMyDetails}
          label="Recipient name"
          placeholder="Full name"
          required
          value={form.recipient_name}
          onChange={(value) => onChange("recipient_name", value)}
        />
        <Field
          disabled={usingMyDetails}
          label="Phone"
          placeholder="9876543210"
          prefix="+91"
          required
          type="tel"
          value={form.phone}
          onChange={(value) => onChange("phone", value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-700 shadow-sm transition active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || cityStatus === "loading"}
          className="h-12 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70"
        >
          {pending ? "Saving..." : "Save address"}
        </button>
      </div>
    </form>
  );
}

function AddressCard({
  address,
  deleting,
  onDelete,
  onEdit,
}: {
  address: UserAddress;
  deleting: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <article className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-extrabold text-gray-900">{address.label}</h3>
          {address.is_default && (
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">
              Default
            </span>
          )}
        </div>
        <p className="mt-2 text-sm font-semibold text-gray-900">
          {address.recipient_name}
        </p>
        <p className="mt-1 text-xs font-semibold text-secondary">{address.phone}</p>
        <p className="mt-2 text-sm leading-5 text-secondary">
          {address.full_address}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 text-xs font-bold text-gray-700 shadow-sm transition active:scale-[0.98]"
        >
          <i className="fa-solid fa-pen" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-xs font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70"
        >
          <i className="fa-solid fa-trash" aria-hidden="true" />
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}

function Field({
  disabled = false,
  inputMode,
  label,
  onChange,
  placeholder,
  prefix,
  maxLength,
  required = false,
  type = "text",
  value,
}: {
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  maxLength?: number;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-secondary">{label}</span>
      <span className="flex h-11 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition focus-within:border-primary/50 focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20">
        {prefix && (
          <span className="flex h-full items-center border-r border-gray-200 px-3 text-sm font-bold text-secondary">
            {prefix}
          </span>
        )}
        <input
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-secondary/60 disabled:bg-gray-100 disabled:text-secondary"
        />
      </span>
    </label>
  );
}

function CityField({
  cityOptions,
  cityStatus,
  onChange,
  selectedCityId,
}: {
  cityOptions: UserAddressCity[];
  cityStatus: "idle" | "loading" | "error";
  onChange: (value: string) => void;
  selectedCityId: string;
}) {
  if (cityOptions.length <= 1) {
    return (
      <Field
        label="City"
        value={
          cityStatus === "loading"
            ? "Finding city..."
            : cityOptions[0]?.name ?? ""
        }
        disabled
        onChange={() => undefined}
      />
    );
  }

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-secondary">City</span>
      <select
        required
        value={selectedCityId}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
      >
        <option value="">Select city</option>
        {cityOptions.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function AddressTypeTabs({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-bold text-secondary">
        Address type
      </span>
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
        {[
          ["home", "Home"],
          ["work", "Work"],
          ["other", "Other"],
        ].map(([optionValue, label]) => (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            aria-pressed={value === optionValue}
            className={`h-10 rounded-lg text-sm font-bold transition ${
              value === optionValue
                ? "bg-primary text-white"
                : "bg-transparent text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function getFormFromAddress(address: UserAddress): AddressFormValues {
  return {
    address_type: address.address_type,
    custom_label: address.custom_label,
    recipient_name: address.recipient_name,
    phone: address.phone,
    address_line1: address.address_line1,
    address_line2: address.address_line2,
    landmark: address.landmark,
    city_id: String(address.city.id),
    postal_code: address.postal_code,
    is_default: address.is_default,
  };
}

function getPayloadFromForm(form: AddressFormValues): UserAddressPayload {
  return {
    address_type: form.address_type,
    custom_label: form.custom_label,
    recipient_name: form.recipient_name,
    phone: form.phone,
    address_line1: form.address_line1,
    address_line2: form.address_line2,
    landmark: form.landmark,
    city_id: Number(form.city_id),
    postal_code: form.postal_code,
    is_default: form.is_default,
    is_active: true,
  };
}

function getPhoneWithoutCountryCode(phone?: string | null) {
  return (phone ?? "").replace(/^\+?91[\s-]?/, "");
}

function phonesMatch(left?: string | null, right?: string | null) {
  return getPhoneWithoutCountryCode(left).replace(/\D/g, "") ===
    getPhoneWithoutCountryCode(right).replace(/\D/g, "");
}
