import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { unregisterCurrentDeviceToken } from "@/lib/notifications";
import {
  fetchCurrentUserThunk,
  sendOtpThunk,
  updateProfileThunk,
  verifyOtpThunk,
} from "./auth-thunks";
import { clearAuthTokens, setAuthTokens } from "./token";
import type { AuthState, AuthUser } from "./types";

const initialState: AuthState = {
  user: null,
  reqId: null,
  identifier: "",
  devOtp: null,
  expiresIn: null,
  step: "phone",
  status: "idle",
  error: null,
};

export const logoutThunk = createAsyncThunk(
  "auth/logoutWithDeviceUnregister",
  async (_, { dispatch }) => {
    void unregisterCurrentDeviceToken();
    dispatch(logout());
  },
);

function shouldCreateProfile(user: AuthUser) {
  return !user.full_name || user.full_name.trim().length === 0;
}

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthFlow(state) {
      state.reqId = null;
      state.identifier = "";
      state.devOtp = null;
      state.expiresIn = null;
      state.step = "phone";
      state.status = "idle";
      state.error = null;
    },
    logout() {
      clearAuthTokens();
      return initialState;
    },
    clearAuthError(state) {
      state.error = null;
    },
    setAuthStep(state, action: PayloadAction<AuthState["step"]>) {
      state.step = action.payload;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOtpThunk.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        state.identifier = action.meta.arg.identifier;
      })
      .addCase(sendOtpThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.reqId = action.payload.req_id;
        state.devOtp = action.payload.otp ?? null;
        state.expiresIn = action.payload.expiresIn ?? null;
        state.step = "verify";
      })
      .addCase(sendOtpThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = String(action.payload ?? "Unable to send OTP.");
      })
      .addCase(verifyOtpThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        setAuthTokens({
          accessToken: action.payload.access_token,
          refreshToken: action.payload.refresh_token,
        });
        state.step = shouldCreateProfile(action.payload.user)
          ? "profile"
          : "phone";
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = String(action.payload ?? "Unable to verify OTP.");
      })
      .addCase(fetchCurrentUserThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addCase(updateProfileThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.step = "phone";
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = String(action.payload ?? "Unable to update profile.");
      });
  },
});

export const { clearAuthError, logout, resetAuthFlow, setAuthStep } =
  authSlice.actions;

export default authSlice.reducer;
