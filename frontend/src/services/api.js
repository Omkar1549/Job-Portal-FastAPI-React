import axios from "axios";
import toast from "react-hot-toast";

// ── Base Axios Instance ───────────────────────────────
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// ── Request Interceptor ───────────────────────────────
// Automatically attaches JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────
// Handles 401 (token expired) globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      toast.error("Session expired. Please log in again.");
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      toast.error("You don't have permission to do that.");
    } else if (error.response?.status === 500) {
      toast.error("Server error. Please try again later.");
    }
    return Promise.reject(error);
  }
);

export default api;