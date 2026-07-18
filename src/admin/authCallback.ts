const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
const searchParams = new URLSearchParams(window.location.search);

const callbackType = hashParams.get("type") || searchParams.get("type") || "";
const callbackTypes = new Set(["email_change", "invite", "magiclink", "recovery", "signup"]);
const callbackKeys = ["access_token", "code", "error", "error_code", "refresh_token", "token_hash"];
const isAdminPath = () => (window.location.pathname.replace(/\/+$/, "") || "/") === "/admin";

function hasUnambiguousOffRouteCallback() {
  const hasTokenPair = hashParams.has("access_token") && hashParams.has("refresh_token");
  const hasTypedCallback = callbackTypes.has(callbackType) && (
    hashParams.has("access_token")
    || hashParams.has("token_hash")
    || searchParams.has("token_hash")
  );
  return hasTokenPair || hasTypedCallback;
}

export function hasAuthCallback() {
  return (isAdminPath() && (
    callbackTypes.has(callbackType)
    || callbackKeys.some((key) => hashParams.has(key) || searchParams.has(key))
  )) || hasUnambiguousOffRouteCallback();
}

export function isPasswordSetupCallback() {
  return callbackType === "invite" || callbackType === "recovery";
}

export function getAuthCallbackErrorMessage() {
  const description = hashParams.get("error_description") || searchParams.get("error_description");
  return description ? description.replace(/\+/g, " ") : "";
}

export function routeAuthCallbackToAdmin() {
  if (!hasUnambiguousOffRouteCallback() || isAdminPath()) return;
  window.history.replaceState(
    window.history.state,
    "",
    `/admin${window.location.search}${window.location.hash}`,
  );
}

export function clearAuthCallbackUrl() {
  if (!hasAuthCallback()) return;
  window.history.replaceState(window.history.state, "", "/admin");
}
