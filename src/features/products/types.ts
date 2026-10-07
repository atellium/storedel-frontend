import type { StoreProduct, StoreProductUpload } from "@/features/stores/types";

export type MeasurementType = "none" | "count" | "weight" | "volume";

export type VariantUnit =
  | "g"
  | "ml"
  | "piece"
  | "pack"
  | "box"
  | "carton"
  | "jar"
  | "can"
  | "bottle"
  | "pouch"
  | "bag"
  | "tray"
  | "tube"
  | "roll";

export type ProductCategory = {
  id: number;
  name: string;
  slug: string;
  aliases: string;
  sort_order: number;
};

export type ProductCategoryFlatResponse = {
  results: ProductCategory[];
  [key: string]: unknown;
};

export type ProductFormValues = {
  name: string;
  short_description: string;
  category_ids: number[];
  upload_ids: string[];
  uploads: StoreProductUpload[];
  brand: string;
  measurement_type: MeasurementType;
  allow_custom_quantity: boolean;
  base_quantity: number | null;
  base_quantity_unit: "g" | "kg" | "ml" | "L" | "piece";
  base_price: number | null;
  minimum_quantity: number | null;
  minimum_quantity_unit: "g" | "kg" | "ml" | "L" | "piece";
  quantity_step: number | null;
  quantity_step_unit: "g" | "kg" | "ml" | "L" | "piece";
  specifications: Record<string, string>;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

export type ProductPayload = Omit<
  ProductFormValues,
  | "uploads"
  | "base_quantity_unit"
  | "minimum_quantity_unit"
  | "quantity_step_unit"
> & {
  base_quantity: number | null;
  minimum_quantity: number | null;
  quantity_step: number | null;
};

export type ProductVariant = StoreProduct["variants"][number] & {
  cost_price?: number | null;
};

export type ProductVariantInput = {
  id?: string;
  value?: number | null;
  unit?: VariantUnit | null;
  pack_count?: number;
  price: number;
  mrp?: number | null;
  cost_price?: number | null;
  is_default?: boolean;
  is_active?: boolean;
  sort_order?: number;
};

export type ProductResponse =
  | StoreProduct
  | {
      result?: StoreProduct;
      product?: StoreProduct;
      data?: StoreProduct;
    };

export type VariantResponse =
  | ProductVariant
  | {
      result?: ProductVariant;
      variant?: ProductVariant;
      data?: ProductVariant;
    };

export type BulkVariantResponse = {
  results: ProductVariant[];
};

export type ProductVariantDraft = {
  client_id: string;
  id?: string;
  value: number | null;
  display_unit: "g" | "kg" | "ml" | "L" | VariantUnit;
  unit: VariantUnit | null;
  pack_count: number;
  price: number | null;
  mrp: number | null;
  cost_price: number | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  display_measurement?: string;
  name?: string;
  bundle_unit_cost_price?: number | null;
  bundle_unit_mrp?: number | null;
  bundle_unit_price?: number | null;
};
