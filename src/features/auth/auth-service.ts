import { privateApiClient, publicApiClient } from "@/lib/api-client";
import type {
  CurrentUserResponse,
  SendOtpPayload,
  SendOtpResponse,
  UpdateProfilePayload,
  UpdateProfileResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from "./types";

export async function sendOtp(payload: SendOtpPayload) {
  const response = await publicApiClient.post<SendOtpResponse>(
    "/api/auth/otp/send/",
    payload,
  );

  return response.data;
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const response = await publicApiClient.post<VerifyOtpResponse>(
    "/api/auth/otp/verify/",
    payload,
  );

  return response.data;
}

export async function getCurrentUser() {
  const response = await privateApiClient.get<CurrentUserResponse>(
    "/api/auth/users/me/",
  );

  return response.data;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
) {
  const response = await privateApiClient.patch<UpdateProfileResponse>(
    "/api/auth/users/me/",
    payload,
  );

  return response.data;
}
