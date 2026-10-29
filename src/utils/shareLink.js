// Helpers that keep dashboard URLs shareable.
// A shared link must carry the network cluster code (login needs it to send the OTP)
// and, once the recipient logs in, bring them back to the page that was shared.

export const CLUSTER_PARAM = "networkClusterCode";
export const REDIRECT_PARAM = "redirect";

const isBrowser = () => typeof window !== "undefined";

export const getStoredClusterCode = () => {
  if (!isBrowser()) return "";
  try {
    const fromStorage = localStorage.getItem(CLUSTER_PARAM);
    if (fromStorage && fromStorage !== "undefined" && fromStorage !== "null") return fromStorage;
    const user = JSON.parse(localStorage.getItem("networkData") || "null");
    return user?.networkClusterDetails?.networkClusterCode || "";
  } catch {
    return "";
  }
};

// Only allow in-app dashboard paths as a post-login destination (no open redirects)
export const sanitizeRedirect = (value) => {
  if (!value || typeof value !== "string") return "";
  if (!value.startsWith("/dashboard") || value.startsWith("//") || value.includes("\\")) return "";
  try {
    const url = new URL(value, "http://local");
    url.searchParams.delete(CLUSTER_PARAM);
    const query = url.searchParams.toString();
    return `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
  } catch {
    return "";
  }
};

// Current page (path + query + hash) without the cluster code, e.g. "/dashboard/expense-records?tab=x"
export const getCurrentPath = () => {
  if (!isBrowser()) return "";
  const { pathname, search, hash } = window.location;
  return sanitizeRedirect(`${pathname}${search}${hash}`);
};

export const getClusterCodeFromUrl = () => {
  if (!isBrowser()) return "";
  return new URLSearchParams(window.location.search).get(CLUSTER_PARAM) || "";
};

// "/?networkClusterCode=ABC&redirect=%2Fdashboard%2Fexpense-records"
export const buildLoginUrl = ({ clusterCode, redirect } = {}) => {
  const params = new URLSearchParams();
  if (clusterCode) params.set(CLUSTER_PARAM, clusterCode);
  const safeRedirect = sanitizeRedirect(redirect);
  if (safeRedirect) params.set(REDIRECT_PARAM, safeRedirect);
  const query = params.toString();
  return query ? `/?${query}` : "/";
};
