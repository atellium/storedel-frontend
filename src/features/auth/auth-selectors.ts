import type { RootState } from "@/store/store";
import { hasAuthTokens } from "./token";

export const selectAuth = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) =>
  Boolean(state.auth.user) && hasAuthTokens();
