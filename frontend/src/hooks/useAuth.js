import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";
import toast from "react-hot-toast";

// ── Auth Context ──────────────────────────────────────
const AuthContext = createContext(null);

// ── Auth Provider ─────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore user from localStorage
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;

        if (decoded.exp > now) {
          setUser(JSON.parse(storedUser));
        } else {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");
        }
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // ── Extract readable error message ────────────────
  const getErrorMessage = (error) => {
    // FastAPI validation errors come as array of objects
    const detail = error.response?.data?.detail;

    if (!detail) return "Something went wrong";

    // If detail is a string — return directly
    if (typeof detail === "string") return detail;

    // If detail is an array (Pydantic validation errors)
    if (Array.isArray(detail)) {
      return detail.map((err) => {
        const field = err.loc ? err.loc[err.loc.length - 1] : "";
        const msg = err.msg || "Invalid value";
        return field ? `${field}: ${msg}` : msg;
      }).join(", ");
    }

    // If detail is an object
    if (typeof detail === "object") {
      return JSON.stringify(detail);
    }

    return "Something went wrong";
  };

  // ── Login ─────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token, user: userData } = response.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      toast.success(`Welcome back, ${userData.full_name}!`);
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Register ──────────────────────────────────────
  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/register", userData);
      toast.success("Account created! Please log in.");
      return { success: true, data: response.data };
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Logout ────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out successfully.");
  }, []);

  const isAdmin = user?.role === "admin";
  const isRecruiter = user?.role === "recruiter" || isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isRecruiter }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── useAuth Hook ──────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
