import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminPortal from "./pages/AdminPortal";
import JobDetail from "./pages/JobDetail";
import ApplicantDetail from "./pages/ApplicantDetail";
import Navbar from "./components/common/Navbar";
import { useAuth, AuthProvider } from "./hooks/useAuth";

// ── Admin Email (Frontend मध्ये पण check) ─────────────
// हे .env मधून येतं
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || "";

// ── Protected Route ───────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#080b12" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{ color: "#3dffc0", fontSize: "1.5rem", fontFamily: "Syne, sans-serif", fontWeight: 800 }}>⬡ TalentAI</div>
          <div style={{ width: 180, height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #3dffc0, #5b8dff)", borderRadius: 2 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // ── Admin check: role + email दोन्ही verify ──────────
  if (adminOnly) {
    const isAdmin = user.role === "admin";
    const isAllowedEmail = ADMIN_EMAIL
      ? user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      : true;

    if (!isAdmin || !isAllowedEmail) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#080b12", flexDirection: "column", gap: "1rem",
        }}>
          <div style={{ fontSize: "3rem" }}>🔒</div>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.5rem", color: "#ff6b6b" }}>
            Access Denied
          </div>
          <div style={{ color: "#6b7a99", fontSize: "0.9rem" }}>
            तुम्हाला Admin Portal access नाही.
          </div>
          <button
            onClick={() => window.location.href = "/"}
            style={{ marginTop: "1rem", padding: "0.7rem 1.5rem", borderRadius: 10, background: "#3dffc0", color: "#080b12", border: "none", fontWeight: 600, cursor: "pointer" }}
          >
            ← Home वर जा
          </button>
        </div>
      );
    }
  }

  return children;
}

// ── Custom Cursor ─────────────────────────────────────
function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = e.clientX + "px";
        dotRef.current.style.top = e.clientY + "px";
      }
    };
    const onEnter = () => setHovered(true);
    const onLeave = () => setHovered(false);
    document.addEventListener("mousemove", onMove);
    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });
    let animId;
    const animRing = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + "px";
        ringRef.current.style.top = ring.current.y + "px";
      }
      animId = requestAnimationFrame(animRing);
    };
    animRing();
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className={`cursor-ring ${hovered ? "hovered" : ""}`} />
    </>
  );
}

// ── App ───────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CustomCursor />
        <div className="noise-overlay" />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#0d1220", color: "#e8edf5", border: "1px solid rgba(255,255,255,0.07)", fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem" },
            success: { iconTheme: { primary: "#3dffc0", secondary: "#080b12" } },
            error: { iconTheme: { primary: "#ff6b6b", secondary: "#080b12" } },
          }}
        />
        <Routes>
          <Route path="/" element={<><Navbar /><Home /></>} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <Navbar /><AdminPortal />
            </ProtectedRoute>
          } />
          <Route path="/jobs/:jobId" element={
            <ProtectedRoute>
              <Navbar /><JobDetail />
            </ProtectedRoute>
          } />
          <Route path="/applicants/:applicantId" element={
            <ProtectedRoute>
              <Navbar /><ApplicantDetail />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
