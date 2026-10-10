"use client";

import { useState } from "react";
import { BottomSheetModal } from "@/components/modals";
import {
  createProductVariant,
  deleteProductVariant,
  updateProductVariant,
} from "../product-service";
import {
  createVariantDraftKey,
  formatVolume,
  formatWeight,
  getDefaultVariantUnit,
  normalizeVariantForApi,
} from "../lib/measurement";
import type {
  MeasurementType,
  ProductVariant,
  ProductVariantDraft,
  VariantUnit,
} from "../types";

type ProductVariantEditorProps = {
  measurementType: MeasurementType;
  variants: ProductVariantDraft[];
  onChange: (variants: ProductVariantDraft[]) => void;
  addLabel?: string;
  description?: string;
  editTitle?: string;
  emptyText?: string;
  enableBundleCreation?: boolean;
  error?: string;
  openFirstWhenEmpty?: boolean;
  productId?: string;
  storeSlug?: string;
  title?: string;
};

const packageUnits: VariantUnit[] = [
  "piece",
  "pack",
  "box",
  "carton",
  "jar",
  "can",
  "bottle",
  "pouch",
  "bag",
  "tray",
  "tube",
  "roll",
];
const countUnits: VariantUnit[] = packageUnits;

export function ProductVariantEditor({
  addLabel = "Add Variant",
  description,
  editTitle = "Variant",
  emptyText = "Add at least one fixed variant.",
  enableBundleCreation = false,
  error,
  measurementType,
  onChange,
  openFirstWhenEmpty = false,
  productId,
  storeSlug,
  title = "Variants",
  variants,
}: ProductVariantEditorProps) {
  const [inlineDraft, setInlineDraft] = useState<ProductVariantDraft | null>(() =>
    openFirstWhenEmpty && variants.length === 0
      ? createEmptyVariant(measurementType, 0)
      : null,
  );
  const [editing, setEditing] = useState<ProductVariantDraft | null>(null);
  const [editingBundle, setEditingBundle] = useState<ProductVariantDraft | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingVariant, setDeletingVariant] = useState<ProductVariantDraft | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingVariantKey, setSavingVariantKey] = useState<string | null>(null);
  const canAddVariant =
    measurementType !== "none" ||
    variants.filter((variant) => variant.is_active).length !== 1;

  const handleSave = async (variant: ProductVariantDraft) => {
    if (savingVariantKey) return;

    setSaveError(null);
    setSavingVariantKey(variant.client_id);

    try {
      const savedVariant =
        storeSlug && productId
          ? variant.id
            ? await updateProductVariant(
                storeSlug,
                productId,
                variant.id,
                normalizeVariantForApi(variant, measurementType),
              )
            : await createProductVariant(
                storeSlug,
                productId,
                normalizeVariantForApi(variant, measurementType),
              )
          : null;
      const nextVariant = savedVariant
        ? variantDraftFromProduct(savedVariant, variant.sort_order)
        : variant;
      const variantClientId = savedVariant ? variant.client_id : nextVariant.client_id;
      const normalizedVariant = savedVariant
        ? { ...nextVariant, client_id: variantClientId }
        : nextVariant;

      const existing = variants.some((item) => item.client_id === variant.client_id);
      const nextVariants = existing
        ? variants.map((item) =>
            item.client_id === variant.client_id ? normalizedVariant : item,
          )
        : [...variants, normalizedVariant];

      onChange(normalizeDefault(nextVariants));
      setInlineDraft(null);
      setEditing(null);
      setEditingBundle(null);
    } catch {
      setSaveError("Could not save this variant. Please try again.");
    } finally {
      setSavingVariantKey(null);
    }
  };

  const handleCreateBundle = (baseVariant: ProductVariantDraft) => {
    setEditingBundle(createBundleVariant(baseVariant, variants.length));
  };

  const handleRemoveDraft = (variant: ProductVariantDraft) => {
    onChange(normalizeDefault(variants.filter((item) => item.client_id !== variant.client_id)));
  };

  const handleDeleteVariant = async () => {
    if (!deletingVariant?.id || !storeSlug || !productId || deleteStatus === "deleting") {
      return;
    }

    setDeleteStatus("deleting");
    setDeleteError(null);

    try {
      await deleteProductVariant(storeSlug, productId, deletingVariant.id);
      onChange(
        normalizeDefault(
          variants.filter((item) => item.client_id !== deletingVariant.client_id),
        ),
      );
      setDeletingVariant(null);
    } catch {
      setDeleteError("Could not delete this variant. Please try again.");
    } finally {
      setDeleteStatus("idle");
    }
  };

  return (
    <section className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-extrabold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-500">
              {description}
            </p>
          )}
        </div>
        {variants.length > 0 && canAddVariant && (
          <button
            type="button"
            onClick={() => setEditing(createEmptyVariant(measurementType, variants.length))}
            className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary transition active:scale-95 hover:bg-primary/20"
          >
            {addLabel}
          </button>
        )}
      </div>

      {inlineDraft ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
          <VariantForm
            compact
            measurementType={measurementType}
            variant={inlineDraft}
            onCancel={() => setInlineDraft(null)}
            onSave={handleSave}
          />
        </div>
      ) : variants.length > 0 ? (
        <div className="mt-4 space-y-3">
          {variants.map((variant, index) => (
            <article key={variant.client_id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {getVariantLabel(variant, measurementType)}
                  </h3>
                  <p className="mt-1 text-[11px] font-semibold text-gray-500">
                    {variant.price !== null ? `₹${variant.price}` : "Price not set"}
                    {variant.mrp !== null ? ` - MRP ₹${variant.mrp}` : ""}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      index > 0 &&
                      onChange(
                        normalizeSortOrder(
                          variants.map((item, itemIndex) =>
                            itemIndex === index - 1
                              ? variants[index]
                              : itemIndex === index
                                ? variants[index - 1]
                                : item,
                          ),
                        ),
                      )
                    }
                    aria-label="Move variant up"
                    className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-200 text-gray-400 transition hover:text-gray-900 active:scale-95"
                  >
                    <i className="fa-solid fa-arrow-up text-[10px]" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      enableBundleCreation && variant.pack_count > 1
                        ? setEditingBundle(variant)
                        : setEditing(variant)
                    }
                    className="flex h-8 items-center justify-center rounded-lg bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:text-gray-900 active:scale-95"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {variant.is_default && <Chip label="Default" variant="primary" />}
                <Chip label={variant.is_active ? "Active" : "Inactive"} variant={variant.is_active ? "success" : "neutral"} />
                {variant.id && <Chip label="Saved" variant="neutral" />}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 border-t border-gray-200/60 pt-3">
                {enableBundleCreation && variant.pack_count === 1 && (
                  <button
                    type="button"
                    onClick={() => handleCreateBundle(variant)}
                    className="text-[11px] font-bold text-primary transition hover:text-primary/80"
                  >
                    Create Bundle/Pack
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (variant.id && storeSlug && productId) {
                      setDeleteError(null);
                      setDeletingVariant(variant);
                      return;
                    }

                    handleRemoveDraft(variant);
                  }}
                  className="text-[11px] font-bold text-red-500 transition hover:text-red-600"
                >
                  {variant.id ? "Delete" : "Remove"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center">
          <p className="text-xs font-semibold text-gray-500">{emptyText}</p>
          <button
            type="button"
            onClick={() => setInlineDraft(createEmptyVariant(measurementType, 0))}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-95"
          >
            {addLabel}
          </button>
        </div>
      )}
      {(error || saveError) && (
        <p className="mt-2 text-[11px] font-semibold text-red-500">
          {saveError ?? error}
        </p>
      )}

      <BottomSheetModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editTitle}
        className="max-w-[640px]"
      >
        {editing && (
          <VariantForm
            key={editing.client_id}
            measurementType={measurementType}
            variant={editing}
            onCancel={() => setEditing(null)}
            onSave={handleSave}
          />
        )}
      </BottomSheetModal>

      <BottomSheetModal
        open={Boolean(editingBundle)}
        onClose={() => setEditingBundle(null)}
        title="Bundle/Pack"
        className="max-w-[640px]"
      >
        {editingBundle && (
          <BundleForm
            key={editingBundle.client_id}
            variant={editingBundle}
            onCancel={() => setEditingBundle(null)}
            onSave={handleSave}
          />
        )}
      </BottomSheetModal>

      <BottomSheetModal
        open={Boolean(deletingVariant)}
        onClose={() => {
          if (deleteStatus === "idle") setDeletingVariant(null);
        }}
        title="Delete variant"
        className="max-w-[640px]"
        closeOnBackdropClick={deleteStatus === "idle"}
      >
        <div className="space-y-4 px-4 pb-6 pt-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
              Delete variant
            </p>
            <h2 className="mt-1 text-xl font-black text-gray-900">
              Remove {deletingVariant ? getVariantLabel(deletingVariant, measurementType) : "variant"}?
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
              This will permanently delete the variant from this product.
            </p>
          </div>

          {deleteError && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600">
              {deleteError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeletingVariant(null)}
              disabled={deleteStatus === "deleting"}
              className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-[13px] font-bold uppercase tracking-wider text-gray-700 shadow-sm transition active:scale-[0.98] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteVariant}
              disabled={deleteStatus === "deleting"}
              className="flex h-12 items-center justify-center rounded-xl bg-red-500 text-[13px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70"
            >
              {deleteStatus === "deleting" ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </BottomSheetModal>
    </section>
  );
}

export function variantsFromProduct(variants: ProductVariant[]) {
  return normalizeDefault(
    variants.map((variant, index) => variantDraftFromProduct(variant, index)),
  );
}

function variantDraftFromProduct(
  variant: ProductVariant,
  fallbackSortOrder: number,
): ProductVariantDraft {
  const displayUnit = getDisplayUnit(variant.unit, variant.value);

  return {
    client_id: variant.id || createVariantDraftKey(),
    id: variant.id,
    value: getDisplayValue(variant.value, displayUnit),
    display_unit: displayUnit,
    unit: toVariantUnit(variant.unit),
    pack_count: variant.pack_count,
    price: variant.price,
    mrp: variant.mrp,
    cost_price: variant.cost_price ?? null,
    is_default: variant.is_default,
    is_active: variant.is_active,
    sort_order: variant.sort_order ?? fallbackSortOrder,
    display_measurement: variant.display_measurement,
    name: variant.name,
  };
}

function VariantForm({
  compact = false,
  measurementType,
  onCancel,
  onSave,
  variant,
}: {
  compact?: boolean;
  measurementType: MeasurementType;
  onCancel: () => void;
  onSave: (variant: ProductVariantDraft) => void;
  variant: ProductVariantDraft;
}) {
  const [draft, setDraft] = useState(variant);
  const [error, setError] = useState<string | null>(null);
  const units = measurementType === "count" ? countUnits : packageUnits;

  const handleSubmit = () => {
    const validationError = validateVariant(draft, measurementType);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(draft);
  };

  return (
    <div className={`space-y-4 ${compact ? "" : "px-4 pb-6 pt-2"}`}>
      {measurementType !== "none" && (
        <div>
          <label htmlFor="variant-value" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Quantity
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
            <input
              id="variant-value"
              type="number"
              min="0"
              value={draft.value ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, value: numberOrNull(event.target.value) })
              }
              className="h-12 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
            {measurementType === "weight" || measurementType === "volume" ? (
              <div className="flex h-12 min-w-0 items-center rounded-xl border border-gray-200 bg-white p-1">
                {(measurementType === "weight" ? ["g", "kg"] : ["ml", "L"]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, display_unit: u as ProductVariantDraft["display_unit"] })
                    }
                    className={`flex h-full flex-1 items-center justify-center rounded-lg text-[11px] font-bold uppercase transition-all ${draft.display_unit === u
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50"
                        : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={draft.unit ?? "piece"}
                onChange={(event) =>
                  setDraft({ ...draft, unit: event.target.value as VariantUnit })
                }
                className="h-12 min-w-0 rounded-xl border border-gray-200 bg-white px-2 text-sm font-bold text-gray-900 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {measurementType === "none" && (
        <SelectField
          label="Package unit"
          value={draft.unit ?? "pack"}
          options={packageUnits}
          onChange={(unit) => setDraft({ ...draft, unit })}
        />
      )}

      <NumberField
        label="Selling price (₹)"
        value={draft.price}
        onChange={(value) => setDraft({ ...draft, price: value })}
      />
      <NumberField
        label="MRP (₹)"
        value={draft.mrp}
        onChange={(value) => setDraft({ ...draft, mrp: value })}
      />
      <NumberField
        label="Cost price (₹)"
        value={draft.cost_price}
        onChange={(value) => setDraft({ ...draft, cost_price: value })}
      />

      <div className="grid gap-3 pt-2">
        <Toggle
          label="Default Variant"
          checked={draft.is_default}
          onChange={(checked) => setDraft({ ...draft, is_default: checked })}
        />
        <Toggle
          label="Active"
          checked={draft.is_active}
          onChange={(checked) => setDraft({ ...draft, is_active: checked })}
        />
      </div>

      {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-[13px] font-bold uppercase tracking-wider text-gray-700 shadow-sm transition active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex h-12 items-center justify-center rounded-xl bg-primary text-[13px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98]"
        >
          Save Variant
        </button>
      </div>
    </div>
  );
}

function BundleForm({
  onCancel,
  onSave,
  variant,
}: {
  onCancel: () => void;
  onSave: (variant: ProductVariantDraft) => void;
  variant: ProductVariantDraft;
}) {
  const [draft, setDraft] = useState(variant);
  const [error, setError] = useState<string | null>(null);
  const unitPrice = variant.bundle_unit_price ?? variant.price;
  const unitMrp = variant.bundle_unit_mrp ?? variant.mrp;
  const unitCostPrice = variant.bundle_unit_cost_price ?? variant.cost_price;

  const updatePackCount = (packCount: number) => {
    setDraft({
      ...draft,
      pack_count: packCount,
      price: unitPrice === null ? null : unitPrice * packCount,
      mrp: unitMrp === null ? null : unitMrp * packCount,
      cost_price: unitCostPrice === null ? null : unitCostPrice * packCount,
    });
  };

  const handleSubmit = () => {
    const validationError = validateBundle(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(draft);
  };

  return (
    <div className="space-y-4 px-4 pb-6 pt-2">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
          Bundle/Pack
        </p>
        <h2 className="mt-1 text-xl font-black text-gray-900">Create Bundle</h2>
      </div>

      <div>
        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Pack count
        </span>
        <div className="flex h-12 items-center justify-between rounded-xl border border-gray-200 bg-white px-2">
          <button
            type="button"
            onClick={() => updatePackCount(Math.max(2, draft.pack_count - 1))}
            disabled={draft.pack_count <= 2}
            aria-label="Decrease pack count"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition active:scale-95 disabled:opacity-40 disabled:active:scale-100"
          >
            <i className="fa-solid fa-minus text-[11px]" aria-hidden="true" />
          </button>
          <span className="min-w-12 text-center text-base font-extrabold text-gray-900">
            {draft.pack_count}
          </span>
          <button
            type="button"
            onClick={() => updatePackCount(draft.pack_count + 1)}
            aria-label="Increase pack count"
            className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-white transition active:scale-95"
          >
            <i className="fa-solid fa-plus text-[11px]" aria-hidden="true" />
          </button>
        </div>
      </div>
      <NumberField
        label="Selling price (₹)"
        value={draft.price}
        onChange={(value) => setDraft({ ...draft, price: value })}
      />
      <NumberField
        label="MRP (₹)"
        value={draft.mrp}
        onChange={(value) => setDraft({ ...draft, mrp: value })}
      />
      <NumberField
        label="Cost price (₹)"
        value={draft.cost_price}
        onChange={(value) => setDraft({ ...draft, cost_price: value })}
      />
      {error && <p className="text-[11px] font-semibold text-red-500">{error}</p>}

      <div className="mt-6 grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-[13px] font-bold uppercase tracking-wider text-gray-700 shadow-sm transition active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex h-12 items-center justify-center rounded-xl bg-primary text-[13px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98]"
        >
          Save Bundle
        </button>
      </div>
    </div>
  );
}

function createEmptyVariant(
  measurementType: MeasurementType,
  sortOrder: number,
): ProductVariantDraft {
  const unit = getDefaultVariantUnit(measurementType);
  return {
    client_id: createVariantDraftKey(),
    value: measurementType === "none" ? null : 1,
    display_unit: measurementType === "weight" ? "kg" : measurementType === "volume" ? "L" : unit,
    unit,
    pack_count: 1,
    price: null,
    mrp: null,
    cost_price: null,
    is_default: sortOrder === 0,
    is_active: true,
    sort_order: sortOrder,
  };
}

function createBundleVariant(
  baseVariant: ProductVariantDraft,
  sortOrder: number,
): ProductVariantDraft {
  const packCount = 2;

  return {
    ...baseVariant,
    client_id: createVariantDraftKey(),
    id: undefined,
    pack_count: packCount,
    price: baseVariant.price === null ? null : baseVariant.price * packCount,
    mrp: baseVariant.mrp === null ? null : baseVariant.mrp * packCount,
    cost_price:
      baseVariant.cost_price === null ? null : baseVariant.cost_price * packCount,
    bundle_unit_cost_price: baseVariant.cost_price,
    bundle_unit_mrp: baseVariant.mrp,
    bundle_unit_price: baseVariant.price,
    is_default: false,
    is_active: true,
    sort_order: sortOrder,
    display_measurement: undefined,
  };
}

function normalizeDefault(variants: ProductVariantDraft[]) {
  const sorted = normalizeSortOrder(variants);
  const selectedDefault = sorted.find((variant) => variant.is_default && variant.is_active);
  if (selectedDefault) {
    return sorted.map((variant) => ({
      ...variant,
      is_default: variant.client_id === selectedDefault.client_id,
    }));
  }

  const firstActive = sorted.find((variant) => variant.is_active);
  if (!firstActive) return sorted.map((variant) => ({ ...variant, is_default: false }));

  return sorted.map((variant) => ({
    ...variant,
    is_default: variant.client_id === firstActive.client_id,
  }));
}

function normalizeSortOrder(variants: ProductVariantDraft[]) {
  return variants.map((variant, index) => ({ ...variant, sort_order: index }));
}

function validateVariant(variant: ProductVariantDraft, measurementType: MeasurementType) {
  if (measurementType !== "none" && (!variant.value || variant.value <= 0)) {
    return "Quantity must be greater than zero.";
  }
  if (variant.price === null) return "Selling price is required.";
  if (variant.price < 0) return "Selling price cannot be negative.";
  if (variant.mrp !== null && variant.mrp < variant.price) {
    return "MRP cannot be lower than selling price.";
  }
  if (variant.cost_price !== null && variant.cost_price < 0) {
    return "Cost price cannot be negative.";
  }
  if (variant.pack_count < 1) return "Pack count must be at least one.";
  return null;
}

function validateBundle(variant: ProductVariantDraft) {
  if (variant.pack_count < 2) return "Pack count must be at least two.";
  if (variant.price === null) return "Selling price is required.";
  if (variant.price < 0) return "Selling price cannot be negative.";
  return null;
}

function getVariantLabel(variant: ProductVariantDraft, measurementType: MeasurementType) {
  if (variant.name) return variant.name;
  if (variant.display_measurement) return variant.display_measurement;
  if (measurementType === "none") return variant.unit ?? "pack";
  if (measurementType === "weight" && variant.value !== null) {
    return variant.display_unit === "kg"
      ? `${variant.value} kg`
      : formatWeight(variant.value);
  }
  if (measurementType === "volume" && variant.value !== null) {
    return variant.display_unit === "L"
      ? `${variant.value} L`
      : formatVolume(variant.value);
  }
  return `${variant.value ?? ""} ${variant.unit ?? ""}`.trim();
}

function getDisplayUnit(unit: string | null, value: number | null) {
  if (unit === "g" && value !== null && value >= 1000) return "kg";
  if (unit === "ml" && value !== null && value >= 1000) return "L";
  return toVariantUnit(unit) ?? "pack";
}

function getDisplayValue(value: number | null, displayUnit: ProductVariantDraft["display_unit"]) {
  if (value === null) return null;
  if (displayUnit === "kg" || displayUnit === "L") return value / 1000;
  return value;
}

function toVariantUnit(unit: string | null): VariantUnit | null {
  if (
    unit === "g" ||
    unit === "ml" ||
    unit === "piece" ||
    unit === "pack" ||
    unit === "box" ||
    unit === "carton" ||
    unit === "jar" ||
    unit === "can" ||
    unit === "bottle" ||
    unit === "pouch" ||
    unit === "bag" ||
    unit === "tray" ||
    unit === "tube" ||
    unit === "roll"
  ) {
    return unit;
  }

  return null;
}

function Chip({ label, variant = "neutral" }: { label: string, variant?: "primary" | "success" | "neutral" }) {
  const styles = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20",
    neutral: "bg-gray-100 text-gray-500",
  };

  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles[variant]}`}>
      {label}
    </span>
  );
}

function NumberField({
  label,
  onChange,
  value,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min="0"
        value={value ?? ""}
        onChange={(event) => onChange(numberOrNull(event.target.value))}
        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
      />
    </div>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  value: VariantUnit;
  options: VariantUnit[];
  onChange: (value: VariantUnit) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as VariantUnit)}
        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition-colors active:border-gray-300">
      <span className="block text-[14px] font-bold text-gray-900">{label}</span>
      <div
        className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out ${checked ? 'bg-primary' : 'bg-gray-300'
          }`}
      >
        <span
          className={`inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${checked ? 'translate-x-[22px]' : 'translate-x-1'
            }`}
        />
      </div>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function numberOrNull(value: string) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
