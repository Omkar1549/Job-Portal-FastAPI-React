import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login, register, user, loading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("signin");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    company: "",
    role: "recruiter",
  });

  // ✅ User login झाल्यावर redirect
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    if (tab === "signin") {
      // ── Login ──────────────────────────────────────
      const result = await login(form.email, form.password);
      if (result.success) {
        // useEffect वर user set होईल आणि redirect होईल
      }
    } else {
      // ── Register ───────────────────────────────────
      const result = await register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        company: form.company,
        role: form.role,
      });

      if (result.success) {
        // Register नंतर Sign In tab वर जा
        setTab("signin");
        // Email ठेव, password clear कर
        setForm((f) => ({ ...f, password: "" }));
      }
    }

    setSubmitting(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    background: "#080b12",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    color: "#e8edf5",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: "0.4rem",
    color: "#6b7a99",
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#080b12", padding: "2rem",
      position: "relative", overflow: "hidden",
    }}>
      {/* Orbs */}
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(61,255,192,0.08) 0%, transparent 70%)", filter: "blur(80px)", top: -100, left: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,141,255,0.08) 0%, transparent 70%)", filter: "blur(80px)", bottom: -100, right: -100, pointerEvents: "none" }} />

      {/* Card */}
      <div style={{
        background: "#0d1220",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 24, padding: "2.5rem",
        width: "100%", maxWidth: 440,
        position: "relative", zIndex: 1,
        animation: "fadeUp 0.5s ease both",
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#3dffc0,#5b8dff)", display: "flex", alignItems: "center", justifyContent: "center" }}>⬡</div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#e8edf5" }}>TalentAI</span>
        </Link>

        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.4rem" }}>
          {tab === "signin" ? "Welcome back" : "Create account"}
        </div>
        <div style={{ color: "#6b7a99", fontSize: "0.875rem", marginBottom: "1.8rem" }}>
          {tab === "signin" ? "Sign in to your TalentAI dashboard" : "Start your 14-day free trial today"}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#080b12", borderRadius: 10, padding: "0.3rem", marginBottom: "1.5rem" }}>
          {["signin", "signup"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "0.5rem", borderRadius: 8,
                border: "none", cursor: "pointer",
                fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", fontWeight: 500,
                background: tab === t ? "#0d1220" : "transparent",
                color: tab === t ? "#e8edf5" : "#6b7a99",
                boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
                transition: "all 0.2s",
              }}
            >
              {t === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {tab === "signup" && (
            <>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  name="full_name"
                  autoComplete="name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Company</label>
                <input
                  name="company"
                  autoComplete="organization"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@company.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              name="password"
              type="password"
              autoComplete={tab === "signin" ? "current-password" : "new-password"}
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            style={{
              marginTop: "0.5rem",
              padding: "0.85rem",
              background: submitting ? "rgba(61,255,192,0.5)" : "#3dffc0",
              color: "#080b12",
              border: "none", borderRadius: 12,
              fontFamily: "DM Sans, sans-serif",
              fontWeight: 700, fontSize: "1rem",
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 0 24px rgba(61,255,192,0.3)",
              transition: "all 0.25s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}
          >
            {submitting && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ animation: "spin 0.8s linear infinite" }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
              </svg>
            )}
            {tab === "signin" ? "Sign In →" : "Create Account →"}
          </button>
        </div>
      </div>
    </div>
  );
}
