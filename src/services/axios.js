import axios from "axios";
import { buildLoginUrl, getCurrentPath, getStoredClusterCode } from "@/utils/shareLink";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },

  // VERY IMPORTANT: resolve every HTTP status so callers can read the API's own error body
  validateStatus: (status) => status < 600,
});

// Keys written by the auth slice; cleared when the session is no longer valid
const AUTH_STORAGE_KEYS = [
  "networkData",
  "token",
  "userEmail",
  "networkClusterCode",
  "adminDetail",
  "selectedRole",
];

let redirectingToLogin = false;

// Token expired / revoked: clear the session and send the user to login,
// keeping the cluster code and the current page so they land back here after signing in.
const handleSessionExpired = () => {
  if (typeof window === "undefined" || redirectingToLogin) return;
  if (!window.location.pathname.startsWith("/dashboard")) return;
  if (!localStorage.getItem("token")) return;

  redirectingToLogin = true;
  const clusterCode = getStoredClusterCode();
  const redirect = getCurrentPath();
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  // Full reload resets every in-memory store (redux + zustand) from the cleared storage
  window.location.replace(buildLoginUrl({ clusterCode, redirect }));
};

// Request interceptor (token)
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (SAFE handling)
api.interceptors.response.use(
  (response) => {
    // The API flags an invalid / expired token with HTTP 401 or `isAuth: false`
    if (response?.status === 401 || response?.data?.isAuth === false) {
      handleSessionExpired();
    }
    return response; // always resolve
  },
  (error) => {
    // This block only runs for network errors, timeouts and CORS issues
    console.error("Network / Axios error:", error);
    return Promise.reject(error);
  }
);

export default api;
