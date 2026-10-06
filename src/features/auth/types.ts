export type AuthUser = {
  id: string;
  email: string | null;
  phone: string;
  full_name: string | null;
};

export type SendOtpPayload = {
  identifier: string;
};

export type SendOtpResponse = {
  type: "success";
  req_id: string;
  otp?: string;
  expiresIn?: number;
};

export type VerifyOtpPayload = {
  req_id: string;
  otp: string;
};

export type VerifyOtpResponse = {
  type: "success";
  message: string;
  user: AuthUser;
  access_token: string;
  refresh_token: string;
};

export type CurrentUserResponse = {
  user: AuthUser;
};

export type UpdateProfilePayload = {
  full_name: string;
  email?: string;
};

export type UpdateProfileResponse = {
  message: string;
  user: AuthUser;
};

export type AuthStep = "phone" | "verify" | "profile";

export type AuthState = {
  user: AuthUser | null;
  reqId: string | null;
  identifier: string;
  devOtp: string | null;
  expiresIn: number | null;
  step: AuthStep;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};
