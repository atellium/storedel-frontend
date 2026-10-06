const ACCESS_TOKEN_KEY = "storedel_access_token";
const REFRESH_TOKEN_KEY = "storedel_refresh_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

function canUseDocument() {
  return typeof document !== "undefined";
}

function setCookie(name: string, value: string) {
  if (!canUseDocument()) return;

  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `max-age=${COOKIE_MAX_AGE}`,
    "path=/",
    "samesite=lax",
  ].join("; ");
}

function getCookie(name: string) {
  if (!canUseDocument()) return null;

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.split("=").slice(1).join("="));
}

function deleteCookie(name: string) {
  if (!canUseDocument()) return;

  document.cookie = `${name}=; max-age=0; path=/; samesite=lax`;
}

export function setAuthTokens({ accessToken, refreshToken }: TokenPair) {
  setCookie(ACCESS_TOKEN_KEY, accessToken);
  setCookie(REFRESH_TOKEN_KEY, refreshToken);
}

export function getAccessToken() {
  return getCookie(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return getCookie(REFRESH_TOKEN_KEY);
}

export function hasAuthTokens() {
  return Boolean(getAccessToken() && getRefreshToken());
}

export function clearAuthTokens() {
  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
}
