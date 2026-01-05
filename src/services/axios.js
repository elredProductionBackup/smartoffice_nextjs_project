import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },

  // 🔑 VERY IMPORTANT
  validateStatus: (status) => status < 600, // prevent Axios throw
});

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
    return response; // ✅ always resolve
  },
  (error) => {
    // This block will now ONLY run for:
    // - Network errors
    // - Timeout
    // - CORS issues

    console.error("Network / Axios error:", error);
    return Promise.reject(error); // only real failures
  }
);

export default api;
