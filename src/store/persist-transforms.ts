import { createTransform } from "redux-persist";
import type { AuthState } from "@/features/auth/types";
import type { PreferencesState } from "./slices/preferences-slice";

type PersistedPreferencesState = Pick<
  PreferencesState,
  "theme" | "language" | "location"
>;

export const preferencesPersistTransform = createTransform<
  PreferencesState,
  PersistedPreferencesState
>(
  (inboundState) => ({
    theme: inboundState.theme,
    language: inboundState.language,
    location: inboundState.location,
  }),
  (outboundState) => ({
    theme: outboundState.theme,
    language: outboundState.language,
    location: outboundState.location ?? null,
    sessionCounter: 0,
  }),
  {
    whitelist: ["preferences"],
  },
);

type PersistedAuthState = Pick<
  AuthState,
  "user"
>;

export const authPersistTransform = createTransform<AuthState, PersistedAuthState>(
  (inboundState) => ({
    user: inboundState.user,
  }),
  (outboundState) => ({
    user: outboundState.user,
    reqId: null,
    identifier: "",
    devOtp: null,
    expiresIn: null,
    step: "phone",
    status: "idle",
    error: null,
  }),
  {
    whitelist: ["auth"],
  },
);
