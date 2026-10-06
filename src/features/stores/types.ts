export type StoreCityState = {
  id: number;
  name: string;
  slug: string;
  code: string;
};

export type StoreCity = {
  id: number;
  name: string;
  slug: string;
  state: StoreCityState;
};

export type Store = {
  id: string;
  name: string;
  title?: string;
  slug: string;
  host_name?: string;
  locality: string;
  city: StoreCity;
  pincode: string;
  latitude: string;
  longitude: string;
  cover_image: string | null;
  is_active: boolean;
  published_at: string | null;
  distance_km?: number;
  delivery_status?: StoreDeliveryStatus;
  updated_at: string;
};

export type StoreHourSlot = {
  open: string;
  close: string;
};

export type StoreDayHours = {
  slots: StoreHourSlot[];
  is_closed: boolean;
};

export type StoreHours = Record<string, StoreDayHours>;

export type StoreCategory = {
  id: number;
  name: string;
  slug: string;
  aliases: string;
  image_url?: string | null;
  sort_order: number;
};

export type StoreCategoryGrid = StoreCategory & {
  children: StoreCategory[];
};

export type StoreDetails = Store & {
  address: string;
  geohash: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  current_status?: {
    text: string;
    next: string;
  };
  store_hours: StoreHours;
  delivery_status?: StoreDeliveryStatus;
  categories: StoreCategory[];
  category_grid?: StoreCategoryGrid[];
  created_at: string;
};

export type StoreDeliveryStatus = {
  pickup?: {
    is_enabled: boolean;
    is_available: boolean;
    next_time: string | null;
  };
  express_delivery?: {
    is_enabled: boolean;
    is_available: boolean;
    next_time: string | null;
  };
  scheduled_delivery?: {
    is_enabled: boolean;
    next_delivery_by: string | null;
  };
};

export type MyStoreDetails = StoreDetails & {
  total_products: number;
  total_orders: number;
};

export type StoresResponse = {
  count: number;
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
    next_page: number | null;
    previous_page: number | null;
  };
  results: Store[];
};

export type SavedStore = {
  id: string;
  store: Store;
  saved_at: string;
};

export type SavedStoresResponse = {
  count: number;
  pagination: StoresResponse["pagination"];
  results: SavedStore[];
};

export type SaveStoreResponse = {
  saved: boolean;
  result: SavedStore;
};

export type StoreDetailsResponse = {
  result: StoreDetails;
};

export type StoreSettings = {
  id: string;
  store: string;
  is_open: boolean;
  is_pickup_enabled: boolean;
  is_express_delivery_enabled: boolean;
  is_scheduled_delivery_enabled: boolean;
  scheduled_delivery_range_km: string;
  scheduled_min_order_amount: number;
  scheduled_delivery_charge: number;
  scheduled_delivery_slots: StoreSettingsSlots;
  scheduled_delivery_disable_till: string | null;
  express_delivery_range_km: string;
  express_min_order_amount: number;
  express_delivery_charge: number;
  express_delivery_disable_till: string | null;
  express_min_delivery_minutes: number;
  express_max_delivery_minutes: number;
  pickup_min_order_amount: number;
  pickup_disable_till: string | null;
  pickup_min_preparation_minutes: number;
  pickup_max_preparation_minutes: number;
  is_pickup_temporarily_disabled: boolean;
  is_express_delivery_temporarily_disabled: boolean;
  is_scheduled_delivery_temporarily_disabled: boolean;
  accepts_pickup: boolean;
  accepts_express_delivery: boolean;
  accepts_scheduled_delivery: boolean;
  has_available_fulfillment_method: boolean;
};

export type StoreSettingsResponse = {
  result: StoreSettings;
};

export type StoreSettingsSlot = {
  start: string;
  end: string;
};

export type StoreSettingsSlots = {
  cutoff_min: number;
} & Record<string, StoreSettingsSlot[] | number>;

export type StoreSettingsPayload = {
  is_open: boolean;
  is_pickup_enabled: boolean;
  is_express_delivery_enabled: boolean;
  is_scheduled_delivery_enabled: boolean;
  scheduled_delivery_range_km: string;
  scheduled_min_order_amount: number;
  scheduled_delivery_charge: number;
  scheduled_delivery_slots: StoreSettingsSlots;
  scheduled_delivery_disable_till: string | null;
  express_delivery_range_km: string;
  express_min_order_amount: number;
  express_delivery_charge: number;
  express_delivery_disable_till: string | null;
  express_min_delivery_minutes: number;
  express_max_delivery_minutes: number;
  pickup_min_order_amount: number;
  pickup_disable_till: string | null;
  pickup_min_preparation_minutes: number;
  pickup_max_preparation_minutes: number;
};

export type StoreProductCategory = {
  id: number;
  name: string;
  slug?: string;
  aliases: string;
  sort_order: number;
};

export type StoreProductListCategory = StoreProductCategory & {
  label: string;
  display_name: string;
  slug: string;
  parent_id: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_searchable: boolean;
  image_url?: string | null;
  related: StoreRelatedCategory[];
};

export type StoreRelatedCategory = {
  id: number;
  name: string;
  slug: string;
  aliases: string;
  image_url: string | null;
  sort_order: number;
};

export type StoreProductVariant = {
  id: string;
  name: string;
  value: number | null;
  unit: string;
  display_measurement: string;
  pack_count: number;
  total_measurement_value: number | null;
  price: number;
  mrp: number | null;
  discount_amount: number;
  discount_percentage: number;
  cart_count?: number;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
};

export type StoreProductUpload = {
  id: string;
  object_key: string;
  url: string;
  mime_type: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type StoreProduct = {
  id: string;
  public_id: string;
  name: string;
  slug: string;
  short_description: string;
  categories: StoreProductCategory[];
  brand: string;
  measurement_type: string;
  allow_custom_quantity: boolean;
  base_quantity: number | null;
  base_price: number | null;
  minimum_quantity: number | null;
  quantity_step: number | null;
  specifications: Record<string, unknown>;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  uploads?: StoreProductUpload[];
  variants: StoreProductVariant[];
  created_at: string;
  updated_at: string;
};

export type StoreProductDetails = StoreProduct & {
  store?: Pick<StoreDetails, "id" | "name" | "slug"> &
    Partial<
      Pick<
        StoreDetails,
        | "address"
        | "city"
        | "cover_image"
        | "delivery_status"
        | "locality"
        | "pincode"
      >
    >;
};

export type StoreProductsResponse = {
  store: {
    id: string;
    name: string;
    slug: string;
  };
  category?: StoreProductListCategory | null;
  count?: number;
  pagination: StoresResponse["pagination"];
  results: StoreProduct[];
};

export type StoreProductDetailsResponse =
  | StoreProductDetails
  | {
      result?: StoreProductDetails;
      product?: StoreProductDetails;
      data?: StoreProductDetails;
    };
