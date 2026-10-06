import { privateApiClient } from "@/lib/api-client";

export type UserAddressCity = {
  id: number;
  name: string;
  slug: string;
  tier: number;
  pincode_prefixes: string[];
  state: {
    id: number;
    name: string;
    slug: string;
    code: string;
  };
};

export type UserAddress = {
  id: string;
  address_type: string;
  custom_label: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  landmark: string;
  city: UserAddressCity;
  postal_code: string;
  latitude: string | null;
  longitude: string | null;
  is_default: boolean;
  is_active: boolean;
  full_address: string;
  created_at: string;
  updated_at: string;
};

export type UserAddressPayload = {
  address_type: string;
  custom_label?: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city_id: number;
  postal_code: string;
  latitude?: string;
  longitude?: string;
  is_default: boolean;
  is_active: boolean;
};

type CityListResponse =
  | { results: UserAddressCity[] }
  | { cities: UserAddressCity[] }
  | UserAddressCity[];

type AddressListResponse =
  | { results: UserAddress[] }
  | { addresses: UserAddress[] }
  | UserAddress[];

type AddressResponse = {
  result: UserAddress;
};

export async function getUserAddresses() {
  const response = await privateApiClient.get<AddressListResponse>(
    "/api/users/me/addresses/",
  );

  if (Array.isArray(response.data)) return response.data;
  if ("results" in response.data) return response.data.results;
  return response.data.addresses;
}

export async function createUserAddress(payload: UserAddressPayload) {
  const response = await privateApiClient.post<AddressResponse>(
    "/api/users/me/addresses/",
    payload,
  );

  return response.data.result;
}

export async function getCitiesByPincodePrefix(pincodePrefix: string) {
  const response = await privateApiClient.get<CityListResponse>(
    "/api/locations/cities/",
    { params: { pincode_prefix: pincodePrefix } },
  );

  if (Array.isArray(response.data)) return response.data;
  if ("results" in response.data) return response.data.results;
  return response.data.cities;
}

export async function updateUserAddress(
  addressId: string,
  payload: UserAddressPayload,
) {
  const response = await privateApiClient.put<AddressResponse>(
    `/api/users/me/addresses/${addressId}/`,
    payload,
  );

  return response.data.result;
}

export async function deleteUserAddress(addressId: string) {
  await privateApiClient.delete(`/api/users/me/addresses/${addressId}/`);
}
