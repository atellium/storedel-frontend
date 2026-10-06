"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/features/auth/auth-guard";
import type { StoreProduct } from "@/features/stores/types";
import {
  createProductVariants,
  createStoreProduct,
  getStoreProduct,
  updateProductVariants,
  updateStoreProduct,
} from "../product-service";
import {
  createVariantDraftKey,
  getDefaultVariantUnit,
  normalizeProductForApi,
  normalizeVariantForApi,
} from "../lib/measurement";
import type {
  MeasurementType,
  ProductFormValues,
  ProductVariantDraft,
} from "../types";
import { ProductCategorySelector } from "./product-category-selector";
import { ProductImageManager } from "./product-image-manager";
import {
  ProductVariantEditor,
  variantsFromProduct,
} from "./product-variant-editor";

type ProductFormProps = {
  mode: "create" | "edit";
  storeSlug: string;
  productId?: string;
};

type FieldErrors = Partial<Record<keyof ProductFormValues | "variants" | "form", string>>;
type SpecRow = { id: string; key: string; value: string };
type ProductStep = "details" | "variants" | "base-price" | "presets" | "settings" | "images";

export function ProductFormPage(props: ProductFormProps) {
  return (
    <AuthGuard>
      <ProductFormContent {...props} />
    </AuthGuard>
  );
}

function ProductFormContent({ mode, productId, storeSlug }: ProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(createInitialValues());
  const [variants, setVariants] = useState<ProductVariantDraft[]>([]);
  const [specRows, setSpecRows] = useState<SpecRow[]>([]);
  const [originalMeasurementType, setOriginalMeasurementType] =
    useState<MeasurementType | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "saving" | "error">(
    mode === "edit" ? "loading" : "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProductStep>("details");
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!isEdit || !productId) return;
    let isMounted = true;

    getStoreProduct(storeSlug, productId)
      .then((product) => {
        if (!isMounted) return;
        setValues(valuesFromProduct(product));
        setSpecRows(rowsFromSpecifications(product.specifications));
        setVariants(variantsFromProduct(product.variants ?? []));
        setOriginalMeasurementType(product.measurement_type as MeasurementType);
        setStatus("idle");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
        setMessage("Could not load product details.");
      });

    return () => {
      isMounted = false;
    };
  }, [isEdit, productId, storeSlug]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || status === "saving") return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, status]);

  const hasMeasurementChangeWarning =
    isEdit &&
    originalMeasurementType !== null &&
    originalMeasurementType !== values.measurement_type &&
    variants.length > 0;
  const hasCustomQuantityWarning =
    values.allow_custom_quantity && variants.some((variant) => variant.id);
  const steps = getProductSteps(values.allow_custom_quantity);
  const activeStep = steps.includes(currentStep) ? currentStep : steps[0];
  const currentStepIndex = steps.indexOf(activeStep);
  const isLastStep = currentStepIndex === steps.length - 1;

  const setField = <Key extends keyof ProductFormValues>(
    key: Key,
    value: ProductFormValues[Key],
  ) => {
    setIsDirty(true);
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleCustomQuantityChange = (enabled: boolean) => {
    setIsDirty(true);
    setValues((current) => ({
      ...current,
      allow_custom_quantity: enabled,
      ...(enabled
        ? {
          base_quantity: getDefaultBaseQuantity(),
          base_quantity_unit: getDefaultBaseQuantityUnit(current.measurement_type),
          minimum_quantity: getDefaultBaseQuantity(),
          minimum_quantity_unit: getDefaultBaseQuantityUnit(current.measurement_type),
          quantity_step: getDefaultBaseQuantity(),
          quantity_step_unit: getDefaultBaseQuantityUnit(current.measurement_type),
        }
        : {
          base_quantity: null,
          base_price: null,
          minimum_quantity: null,
          quantity_step: null,
        }),
    }));
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm("You have unsaved changes. Discard changes?")) {
      return;
    }

    router.push(`/${storeSlug}/manage/products`);
  };

  const goToNextStep = () => {
    const nextErrors = validateStep(activeStep, values, variants);
    setErrors((current) => ({ ...current, ...nextErrors }));
    setMessage(null);

    if (Object.keys(nextErrors).length > 0) return;

    const nextStep = steps[Math.min(currentStepIndex + 1, steps.length - 1)];

    if (values.allow_custom_quantity && nextStep === "presets" && variants.length === 0) {
      setIsDirty(true);
      setVariants([createBasePresetVariant(values)]);
    }

    setCurrentStep(nextStep);
  };

  const goToPreviousStep = () => {
    setCurrentStep(steps[Math.max(currentStepIndex - 1, 0)]);
  };

  const handleSubmit = async () => {
    if (status === "saving") return;

    const nextSpecifications = specificationsFromRows(specRows);
    const nextValues = { ...values, specifications: nextSpecifications };
    const nextErrors = validateProduct(nextValues, variants);
    setErrors(nextErrors);
    setMessage(null);

    if (Object.keys(nextErrors).length > 0) return;

    setStatus("saving");

    try {
      const productPayload = normalizeProductForApi(nextValues);
      const variantPayload = variants.map((variant) =>
        normalizeVariantForApi(variant, nextValues.measurement_type),
      );

      console.log("Saving product payload", {
        product: productPayload,
        variants: variantPayload,
      });

      if (isEdit && productId) {
        const product = await updateStoreProduct(storeSlug, productId, productPayload);
        if (variantPayload.length > 0) {
          await updateProductVariants(storeSlug, product.id, variantPayload);
        }
        setIsDirty(false);
        setMessage("Product updated successfully.");
        router.push(`/${storeSlug}/manage/products`);
        return;
      }

      const product = await createStoreProduct(storeSlug, productPayload);
      if (variantPayload.length > 0) {
        try {
          await createProductVariants(storeSlug, product.id, variantPayload);
        } catch {
          setStatus("idle");
          setMessage("Product was saved, but variants could not be saved. Edit this product to retry variants.");
          setIsDirty(false);
          return;
        }
      }

      setIsDirty(false);
      setMessage("Product created successfully.");
      router.push(`/${storeSlug}/manage/products`);
    } catch (error) {
      setStatus("idle");
      setErrors(mapApiError(error));
      setMessage(getApiErrorMessage(error));
    }
  };

  if (status === "loading") {
    return (
      <Shell
        storeSlug={storeSlug}
        title="Edit Product"
        onBack={handleCancel}
      >
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-[20px] bg-white shadow-sm" />
          ))}
        </div>
      </Shell>
    );
  }

  if (status === "error") {
    return (
      <Shell storeSlug={storeSlug} title="Edit Product" onBack={handleCancel}>
        <div className="rounded-[20px] border border-red-100 bg-red-50 px-4 py-6 text-center text-sm font-semibold text-red-500 shadow-sm">
          {message ?? "Could not load product."}
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      storeSlug={storeSlug}
      title={isEdit ? "Edit Product" : "Add Product"}
      subtitle={isEdit ? values.name : undefined}
      onBack={handleCancel}
    >
      <div className="space-y-5 pb-24">
        {message && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 shadow-sm">
            {message}
          </div>
        )}
        {errors.form && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 shadow-sm">
            {errors.form}
          </div>
        )}

        <StepIndicator currentStep={activeStep} steps={steps} />

        {activeStep === "details" && (
          <>
            <section className="space-y-4 rounded-[20px] border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h2 className="text-[15px] font-extrabold text-gray-900">Product Information</h2>
              <TextField
                label="Product Name *"
                value={values.name}
                error={errors.name}
                onChange={(value) => setField("name", value)}
              />
              <TextAreaField
                label="Short Description"
                value={values.short_description}
                onChange={(value) => setField("short_description", value)}
              />
              <TextField
                label="Brand"
                value={values.brand}
                onChange={(value) => setField("brand", value)}
              />
              <ProductCategorySelector
                value={values.category_ids}
                onChange={(categoryIds) => setField("category_ids", categoryIds)}
                error={errors.category_ids}
              />
            </section>

            <section className="space-y-4 rounded-[20px] border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h2 className="text-[15px] font-extrabold text-gray-900">Selling Method</h2>
              <div className="grid grid-cols-3 gap-2">
                {(["none", "weight", "volume"] as MeasurementType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setField("measurement_type", type)}
                    className={`rounded-xl border p-3 text-left transition active:scale-95 ${values.measurement_type === type
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <span className="block text-[13px] font-bold">{typeLabel(type)}</span>
                    <span className={`mt-1 block text-[10px] font-medium leading-tight ${values.measurement_type === type ? "text-primary/70" : "text-gray-500"}`}>
                      {typeHelp(type)}
                    </span>
                  </button>
                ))}
              </div>
              {hasMeasurementChangeWarning && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-600">
                  Changing measurement type may make existing variants invalid. Review variants before saving.
                </p>
              )}
              <Toggle
                label="Custom Quantity"
                checked={values.allow_custom_quantity}
                onChange={handleCustomQuantityChange}
              />
              {hasCustomQuantityWarning && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-600">
                  Existing variants will not be used for customer quantity selection.
                </p>
              )}
            </section>
          </>
        )}

        {activeStep === "base-price" && (
          <CustomQuantityBaseFields
            errors={errors}
            values={values}
            onChange={setField}
          />
        )}

        {(activeStep === "variants" || activeStep === "presets") && (
          <div className="space-y-4">
            <ProductVariantEditor
              addLabel={values.allow_custom_quantity ? "+ Add Preset" : "+ Add Variant"}
              description={
                values.allow_custom_quantity
                  ? "Quick presets give customers one-tap quantity choices while still allowing custom quantity."
                  : undefined
              }
              emptyText={
                values.allow_custom_quantity
                  ? "Add optional quick presets for common quantities."
                  : "Add at least one fixed variant."
              }
              editTitle={values.allow_custom_quantity ? "Quick Preset" : "Variant"}
              enableBundleCreation={!values.allow_custom_quantity}
              measurementType={values.measurement_type}
              openFirstWhenEmpty={!values.allow_custom_quantity && activeStep === "variants"}
              removeSavedLabel="Mark inactive"
              title={values.allow_custom_quantity ? "Quick Presets" : "Variants"}
              variants={variants}
              onChange={(nextVariants) => {
                setIsDirty(true);
                setVariants(nextVariants);
              }}
              error={errors.variants}
            />
          </div>
        )}

        {activeStep === "settings" && (
          <>
            <SpecificationsEditor
              rows={specRows}
              onChange={(rows) => {
                setIsDirty(true);
                setSpecRows(rows);
              }}
            />

            <section className="space-y-4 rounded-[20px] border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <h2 className="text-[15px] font-extrabold text-gray-900">Visibility Settings</h2>
              <div className="grid gap-3">
                <Toggle
                  label="Active Product"
                  checked={values.is_active}
                  onChange={(checked) => setField("is_active", checked)}
                />
                <Toggle
                  label="Featured Product"
                  checked={values.is_featured}
                  onChange={(checked) => setField("is_featured", checked)}
                />
              </div>
              <NumberField
                label="Sort Order"
                value={values.sort_order}
                onChange={(value) => setField("sort_order", value ?? 0)}
              />
            </section>
          </>
        )}

        {activeStep === "images" && (
          <ProductImageManager
            uploads={values.uploads}
            onChange={(uploads) => {
              setIsDirty(true);
              setValues((current) => ({
                ...current,
                upload_ids: uploads.map((upload) => upload.id),
                uploads,
              }));
            }}
          />
        )}

        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-[640px] grid-cols-2 gap-3 border-t border-gray-100 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <button
            type="button"
            onClick={currentStepIndex === 0 ? handleCancel : goToPreviousStep}
            className="flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-[13px] font-bold uppercase tracking-wider text-gray-700 shadow-sm transition active:scale-[0.98]"
          >
            {currentStepIndex === 0 ? "Cancel" : "Back"}
          </button>
          <button
            type="button"
            onClick={isLastStep ? handleSubmit : goToNextStep}
            disabled={status === "saving"}
            className="flex h-12 items-center justify-center rounded-xl bg-primary text-[13px] font-bold uppercase tracking-wider text-white shadow-sm transition active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            {status === "saving"
              ? "Saving..."
              : isLastStep
                ? isEdit
                  ? "Save Changes"
                  : "Save Product"
                : "Next"}
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Shell({
  children,
  onBack,
  storeSlug,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  onBack: () => void;
  storeSlug: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-[#f4f7f8] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex h-10 items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-base" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-base font-bold leading-tight text-gray-900">{title}</h1>
            {subtitle && <p className="truncate text-[11px] font-medium text-gray-500">{subtitle}</p>}
          </div>
          <Link
            href={`/${storeSlug}/manage/products`}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-primary transition active:scale-95"
            aria-label="Products"
          >
            <i className="fa-solid fa-box-open text-sm" aria-hidden="true" />
          </Link>
        </div>
      </header>
      <section className="px-4 py-5">{children}</section>
    </main>
  );
}

function createInitialValues(): ProductFormValues {
  return {
    name: "",
    short_description: "",
    category_ids: [],
    upload_ids: [],
    uploads: [],
    brand: "",
    measurement_type: "none",
    allow_custom_quantity: false,
    base_quantity: null,
    base_quantity_unit: "g",
    base_price: null,
    minimum_quantity: null,
    minimum_quantity_unit: "g",
    quantity_step: null,
    quantity_step_unit: "g",
    specifications: {},
    is_active: true,
    is_featured: false,
    sort_order: 0,
  };
}

function getProductSteps(allowCustomQuantity: boolean): ProductStep[] {
  return allowCustomQuantity
    ? ["details", "base-price", "presets", "settings", "images"]
    : ["details", "variants", "settings", "images"];
}

function StepIndicator({
  currentStep,
  steps,
}: {
  currentStep: ProductStep;
  steps: ProductStep[];
}) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => (
          <div key={step} className="min-w-0">
            <div
              className={`h-1.5 rounded-full transition-colors ${index <= currentIndex ? "bg-primary" : "bg-gray-100"
                }`}
            />
            <p
              className={`mt-2 truncate text-[9px] font-bold uppercase tracking-wider ${index === currentIndex ? "text-primary" : "text-gray-400"
                }`}
            >
              {stepLabel(step)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function stepLabel(step: ProductStep) {
  if (step === "details") return "Details";
  if (step === "variants") return "Variants";
  if (step === "base-price") return "Base Price";
  if (step === "presets") return "Presets";
  if (step === "settings") return "Settings";
  return "Images";
}

function valuesFromProduct(product: StoreProduct): ProductFormValues {
  const values = createInitialValues();
  const measurementType = toMeasurementType(product.measurement_type);
  return {
    ...values,
    name: product.name ?? "",
    short_description: product.short_description ?? "",
    category_ids: (product.categories ?? []).map((category) => category.id),
    upload_ids: product.uploads?.map((upload) => upload.id) ?? [],
    uploads: product.uploads ?? [],
    brand: product.brand ?? "",
    measurement_type: measurementType,
    allow_custom_quantity: Boolean(product.allow_custom_quantity),
    base_quantity: product.base_quantity,
    base_quantity_unit: defaultQuantityUnit(measurementType),
    base_price: product.base_price,
    minimum_quantity: product.minimum_quantity,
    minimum_quantity_unit: defaultQuantityUnit(measurementType),
    quantity_step: product.quantity_step,
    quantity_step_unit: defaultQuantityUnit(measurementType),
    specifications: stringifySpecifications(product.specifications ?? {}),
    is_active: product.is_active,
    is_featured: Boolean(product.is_featured),
    sort_order: product.sort_order ?? 0,
  };
}

function CustomQuantityBaseFields({
  errors,
  onChange,
  values,
}: {
  errors: FieldErrors;
  values: ProductFormValues;
  onChange: <Key extends keyof ProductFormValues>(
    key: Key,
    value: ProductFormValues[Key],
  ) => void;
}) {
  return (
    <section className="space-y-4 rounded-[20px] border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <h2 className="text-[15px] font-extrabold text-gray-900">Base Price Configuration</h2>
      <QuantityField
        label="Base Quantity"
        measurementType={values.measurement_type}
        value={values.base_quantity}
        unit={values.base_quantity_unit}
        error={errors.base_quantity}
        onValueChange={(value) => onChange("base_quantity", value)}
        onUnitChange={(unit) => onChange("base_quantity_unit", unit)}
        disabled
      />
      <NumberField
        label="Base Price (₹)"
        value={values.base_price}
        error={errors.base_price}
        onChange={(value) => onChange("base_price", value)}
      />
      <QuantityField
        label="Minimum Quantity allowed"
        measurementType={values.measurement_type}
        value={values.minimum_quantity}
        unit={values.minimum_quantity_unit}
        error={errors.minimum_quantity}
        onValueChange={(value) => onChange("minimum_quantity", value)}
        onUnitChange={(unit) => onChange("minimum_quantity_unit", unit)}
      />
      <QuantityField
        label="Quantity Step (Increment by)"
        measurementType={values.measurement_type}
        value={values.quantity_step}
        unit={values.quantity_step_unit}
        error={errors.quantity_step}
        onValueChange={(value) => onChange("quantity_step", value)}
        onUnitChange={(unit) => onChange("quantity_step_unit", unit)}
      />
    </section>
  );
}

function createBasePresetVariant(values: ProductFormValues): ProductVariantDraft {
  const unit = getDefaultVariantUnit(values.measurement_type);

  return {
    client_id: createVariantDraftKey(),
    value: values.measurement_type === "none" ? null : values.base_quantity,
    display_unit: values.measurement_type === "none" ? unit : values.base_quantity_unit,
    unit,
    pack_count: 1,
    price: values.base_price,
    mrp: null,
    cost_price: null,
    is_default: true,
    is_active: true,
    sort_order: 0,
  };
}

function SpecificationsEditor({
  onChange,
  rows,
}: {
  rows: SpecRow[];
  onChange: (rows: SpecRow[]) => void;
}) {
  return (
    <section className="space-y-4 rounded-[20px] border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold text-gray-900">Specifications</h2>
        <button
          type="button"
          onClick={() => onChange([...rows, { id: crypto.randomUUID(), key: "", value: "" }])}
          className="rounded-lg bg-primary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary transition active:scale-95"
        >
          + Add Spec
        </button>
      </div>
      {rows.length === 0 && (
        <p className="text-xs font-medium text-gray-400">No specifications added yet.</p>
      )}
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="flex gap-2">
            <input
              aria-label="Specification title"
              value={row.key}
              onChange={(event) =>
                onChange(rows.map((item) => (item.id === row.id ? { ...item, key: event.target.value } : item)))
              }
              placeholder="e.g. Color"
              className="h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
            />
            <input
              aria-label="Specification value"
              value={row.value}
              onChange={(event) =>
                onChange(rows.map((item) => (item.id === row.id ? { ...item, value: event.target.value } : item)))
              }
              placeholder="e.g. Red"
              className="h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="button"
              aria-label="Remove specification"
              onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition active:scale-95"
            >
              <i className="fa-solid fa-trash text-[13px]" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function TextField({
  error,
  label,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
      />
      {error && <p className="mt-1 text-[11px] font-semibold text-red-500">{error}</p>}
    </div>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
      />
    </div>
  );
}

function NumberField({
  error,
  label,
  onChange,
  value,
}: {
  error?: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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
        className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20"
      />
      {error && <p className="mt-1 text-[11px] font-semibold text-red-500">{error}</p>}
    </div>
  );
}

function QuantityField({
  disabled = false,
  error,
  label,
  measurementType,
  onUnitChange,
  onValueChange,
  unit,
  value,
}: {
  disabled?: boolean;
  error?: string;
  label: string;
  measurementType: MeasurementType;
  value: number | null;
  unit: ProductFormValues["base_quantity_unit"];
  onValueChange: (value: number | null) => void;
  onUnitChange: (unit: ProductFormValues["base_quantity_unit"]) => void;
}) {
  const units =
    measurementType === "weight"
      ? ["g", "kg"]
      : measurementType === "volume"
        ? ["ml", "L"]
        : ["piece"];
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="number"
          min="0"
          value={value ?? ""}
          disabled={disabled}
          onChange={(event) => onValueChange(numberOrNull(event.target.value))}
          className="h-12 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20 disabled:bg-gray-100 disabled:text-gray-400"
        />
        {units.length === 2 ? (
          <div className={`flex h-12 w-[110px] shrink-0 items-center rounded-xl border border-gray-200 bg-gray-50 p-1 ${disabled ? 'opacity-60' : ''}`}>
            {units.map((nextUnit) => (
              <button
                key={nextUnit}
                type="button"
                disabled={disabled}
                onClick={() => onUnitChange(nextUnit as any)}
                className={`flex h-full flex-1 items-center justify-center rounded-lg text-[11px] font-bold uppercase transition-all ${unit === nextUnit
                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {nextUnit}
              </button>
            ))}
          </div>
        ) : (
          <select
            value={unit}
            disabled={disabled}
            onChange={(event) => onUnitChange(event.target.value as ProductFormValues["base_quantity_unit"])}
            className="h-12 w-[110px] shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20 disabled:bg-gray-100 disabled:text-gray-400"
          >
            {units.map((nextUnit) => (
              <option key={nextUnit} value={nextUnit}>
                {nextUnit}
              </option>
            ))}
          </select>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] font-semibold text-red-500">{error}</p>}
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
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition-colors active:bg-gray-100/50">
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

function validateStep(
  step: ProductStep,
  values: ProductFormValues,
  variants: ProductVariantDraft[],
) {
  const errors: FieldErrors = {};

  if (step === "details") {
    if (!values.name.trim()) errors.name = "Product name is required.";
    if (values.category_ids.length === 0) {
      errors.category_ids = "Select at least one category.";
    }
  }

  if (step === "base-price") {
    if (!values.base_quantity || values.base_quantity <= 0) {
      errors.base_quantity = "Base quantity must be greater than zero.";
    }
    if (values.base_price === null || values.base_price < 0) {
      errors.base_price = "Base price cannot be negative.";
    }
    if (!values.minimum_quantity || values.minimum_quantity <= 0) {
      errors.minimum_quantity = "Minimum quantity must be greater than zero.";
    }
    if (!values.quantity_step || values.quantity_step <= 0) {
      errors.quantity_step = "Quantity step must be greater than zero.";
    }
  }

  if (step === "variants" && variants.length === 0) {
    errors.variants = "Add at least one variant.";
  }

  return errors;
}

function validateProduct(values: ProductFormValues, variants: ProductVariantDraft[]) {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = "Product name is required.";
  if (values.category_ids.length === 0) errors.category_ids = "Select at least one category.";
  if (values.allow_custom_quantity) {
    if (!values.base_quantity || values.base_quantity <= 0) {
      errors.base_quantity = "Base quantity must be greater than zero.";
    }
    if (values.base_price === null || values.base_price < 0) {
      errors.base_price = "Base price cannot be negative.";
    }
    if (!values.minimum_quantity || values.minimum_quantity <= 0) {
      errors.minimum_quantity = "Minimum quantity must be greater than zero.";
    }
    if (!values.quantity_step || values.quantity_step <= 0) {
      errors.quantity_step = "Quantity step must be greater than zero.";
    }
  }

  if (!values.allow_custom_quantity && variants.length === 0) {
    errors.variants = "Add at least one variant.";
  }

  return errors;
}

function mapApiError(error: unknown): FieldErrors {
  if (!isAxiosLikeError(error)) return {};
  const data = error.response?.data;
  if (!data || typeof data !== "object") return {};

  const errors: FieldErrors = {};
  Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
    if (typeof value === "string") {
      errors[key as keyof FieldErrors] = value;
    } else if (Array.isArray(value)) {
      errors[key as keyof FieldErrors] = value.join(" ");
    }
  });
  return errors;
}

function getApiErrorMessage(error: unknown) {
  if (!isAxiosLikeError(error)) {
    return "Unable to save product. Check your connection and try again.";
  }
  if (error.response?.status === 403) return "You don't have permission to manage this product.";
  if (error.response?.status === 404) return "Product not found.";
  if (error.response?.status === 400) return "Please fix the highlighted fields.";
  if (error.response?.status === 409) return "This product could not be saved because of a conflict.";
  if (error.response?.status && error.response.status >= 500) {
    return "Server error. Please try again.";
  }
  return "Unable to save product. Check your connection and try again.";
}

function isAxiosLikeError(error: unknown): error is {
  response?: { status?: number; data?: unknown };
} {
  return typeof error === "object" && error !== null && "response" in error;
}

function specificationsFromRows(rows: SpecRow[]) {
  const result: Record<string, string> = {};
  const seen = new Set<string>();

  rows.forEach((row) => {
    const key = row.key.trim();
    const value = row.value.trim();
    const normalizedKey = key.toLowerCase();
    if (!key || !value || seen.has(normalizedKey)) return;
    seen.add(normalizedKey);
    result[key] = value;
  });

  return result;
}

function rowsFromSpecifications(specifications: Record<string, unknown> | null | undefined) {
  if (!specifications) return [];

  return Object.entries(specifications).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value: String(value ?? ""),
  }));
}

function stringifySpecifications(specifications: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(specifications).map(([key, value]) => [key, String(value ?? "")]),
  );
}

function defaultQuantityUnit(measurementType: MeasurementType) {
  if (measurementType === "volume") return "ml";
  if (measurementType === "count") return "piece";
  return "g";
}

function getDefaultBaseQuantity() {
  return 1;
}

function getDefaultBaseQuantityUnit(measurementType: MeasurementType) {
  if (measurementType === "weight") return "kg";
  if (measurementType === "volume") return "L";
  return "piece";
}

function toMeasurementType(value: string): MeasurementType {
  if (value === "count" || value === "weight" || value === "volume") return value;
  return "none";
}

function typeLabel(type: MeasurementType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function typeHelp(type: MeasurementType) {
  if (type === "weight") return "g or kg";
  if (type === "volume") return "ml or L";
  if (type === "count") return "pieces and packs";
  return "packaged unit";
}

function numberOrNull(value: string) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}