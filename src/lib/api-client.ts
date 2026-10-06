import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/features/auth/token";

type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
};

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const publicApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
});

export const privateApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshTokenRequest: Promise<RefreshTokenResponse> | null = null;

privateApiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

privateApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      clearAuthTokens();
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearAuthTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshTokenRequest ??= publicApiClient
        .post<RefreshTokenResponse>("/api/auth/token/refresh/", {
          refresh_token: refreshToken,
        })
        .then((response) => response.data)
        .finally(() => {
          refreshTokenRequest = null;
        });

      const tokens = await refreshTokenRequest;

      setAuthTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });

      originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;

      return privateApiClient(originalRequest);
    } catch (refreshError) {
      clearAuthTokens();
      return Promise.reject(refreshError);
    }
  },
);

export const apiClient = publicApiClient;
