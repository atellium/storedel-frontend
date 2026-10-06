import type {
  MeasurementType,
  ProductFormValues,
  ProductPayload,
  ProductVariantDraft,
  ProductVariantInput,
  VariantUnit,
} from "../types";

export function toGrams(value: number, unit: "g" | "kg") {
  return unit === "kg" ? value * 1000 : value;
}

export function toMillilitres(value: number, unit: "ml" | "L") {
  return unit === "L" ? value * 1000 : value;
}

export function formatWeight(valueInGrams: number) {
  if (valueInGrams >= 1000) return `${formatNumber(valueInGrams / 1000)} kg`;
  return `${formatNumber(valueInGrams)} g`;
}

export function formatVolume(valueInMl: number) {
  if (valueInMl >= 1000) return `${formatNumber(valueInMl / 1000)} L`;
  return `${formatNumber(valueInMl)} ml`;
}

export function normalizeMeasurementValue(
  value: number | null,
  measurementType: MeasurementType,
  unit: string,
) {
  if (value === null) return null;
  if (measurementType === "weight") return toGrams(value, unit === "kg" ? "kg" : "g");
  if (measurementType === "volume") return toMillilitres(value, unit === "L" ? "L" : "ml");
  return value;
}

export function normalizeProductForApi(values: ProductFormValues): ProductPayload {
  const allowCustomQuantity = values.allow_custom_quantity;

  return {
    name: values.name.trim(),
    short_description: values.short_description.trim(),
    category_ids: values.category_ids.map(Number),
    upload_ids: values.upload_ids,
    brand: values.brand.trim(),
    measurement_type: values.measurement_type,
    allow_custom_quantity: allowCustomQuantity,
    base_quantity: allowCustomQuantity
      ? normalizeMeasurementValue(
          values.base_quantity,
          values.measurement_type,
          values.base_quantity_unit,
        )
      : null,
    base_price: allowCustomQuantity ? values.base_price : null,
    minimum_quantity: allowCustomQuantity
      ? normalizeMeasurementValue(
          values.minimum_quantity,
          values.measurement_type,
          values.minimum_quantity_unit,
        )
      : null,
    quantity_step: allowCustomQuantity
      ? normalizeMeasurementValue(
          values.quantity_step,
          values.measurement_type,
          values.quantity_step_unit,
        )
      : null,
    specifications: cleanSpecifications(values.specifications),
    is_active: values.is_active,
    is_featured: values.is_featured,
    sort_order: values.sort_order,
  };
}

export function normalizeVariantForApi(
  variant: ProductVariantDraft,
  measurementType: MeasurementType,
): ProductVariantInput {
  const value =
    measurementType === "none"
      ? null
      : normalizeMeasurementValue(variant.value, measurementType, variant.display_unit);
  const unit = normalizeVariantUnit(measurementType, variant);

  return {
    ...(variant.id ? { id: variant.id } : {}),
    value,
    unit,
    pack_count: variant.pack_count,
    price: variant.price ?? 0,
    mrp: variant.mrp,
    cost_price: variant.cost_price,
    is_default: variant.is_default,
    is_active: variant.is_active,
    sort_order: variant.sort_order,
  };
}

export function createVariantDraftKey() {
  return crypto.randomUUID();
}

export function getDefaultVariantUnit(measurementType: MeasurementType): VariantUnit {
  if (measurementType === "weight") return "g";
  if (measurementType === "volume") return "ml";
  if (measurementType === "count") return "piece";
  return "pack";
}

function normalizeVariantUnit(
  measurementType: MeasurementType,
  variant: ProductVariantDraft,
) {
  if (measurementType === "weight") return "g";
  if (measurementType === "volume") return "ml";
  return variant.unit;
}

function cleanSpecifications(specifications: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(specifications)
      .map(([key, value]) => [key.trim(), value.trim()])
      .filter(([key, value]) => key && value),
  );
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}
