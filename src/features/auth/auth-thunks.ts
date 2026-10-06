import { createAsyncThunk } from "@reduxjs/toolkit";
import { isAxiosError } from "axios";
import {
  getCurrentUser,
  sendOtp,
  updateProfile,
  verifyOtp,
} from "./auth-service";
import { hasAuthTokens } from "./token";
import type {
  SendOtpPayload,
  UpdateProfilePayload,
  VerifyOtpPayload,
} from "./types";

function extractErrorMessage(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === "string") return data;

  if (Array.isArray(data)) {
    return data
      .map((entry) => extractErrorMessage(entry))
      .filter(Boolean)
      .join(" ");
  }

  if (typeof data === "object") {
    const errorData = data as Record<string, unknown>;
    const preferredKeys = ["detail", "message", "error", "non_field_errors"];

    for (const key of preferredKeys) {
      const message = extractErrorMessage(errorData[key]);
      if (message) return message;
    }

    for (const value of Object.values(errorData)) {
      const message = extractErrorMessage(value);
      if (message) return message;
    }
  }

  return null;
}

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    return (
      extractErrorMessage(error.response?.data) ||
      "Something went wrong. Please try again."
    );
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export const sendOtpThunk = createAsyncThunk(
  "auth/sendOtp",
  async (payload: SendOtpPayload, { rejectWithValue }) => {
    try {
      return await sendOtp({
        identifier: `+91${payload.identifier}`,
      });
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const verifyOtpThunk = createAsyncThunk(
  "auth/verifyOtp",
  async (payload: VerifyOtpPayload, { rejectWithValue }) => {
    try {
      return await verifyOtp(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchCurrentUserThunk = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      if (!hasAuthTokens()) throw new Error("Missing auth tokens.");
      return await getCurrentUser();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateProfileThunk = createAsyncThunk(
  "auth/updateProfile",
  async (payload: UpdateProfilePayload, { rejectWithValue }) => {
    try {
      if (!hasAuthTokens()) throw new Error("Missing auth tokens.");
      return await updateProfile(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

