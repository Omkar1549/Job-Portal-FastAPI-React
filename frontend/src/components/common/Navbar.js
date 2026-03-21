import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

// ── Navbar ────────────────────────────────────────────
export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { to: "/#features", label: "Features" },
    { to: "/#how", label: "How it Works" },
    { to: "/#pricing", label: "Pricing" },
  ];

  if (isAdmin) {
    navLinks.push({ to: "/admin", label: "Admin Portal" });
  }

  return (
    <nav
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: scrolled ? "0.8rem 4rem" : "1.2rem 4rem",
        background: "rgba(8,11,18,0.8)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        transition: "padding 0.3s ease",
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, #3dffc0, #5b8dff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.9rem",
        }}>⬡</div>
        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#e8edf5" }}>
          TalentAI
        </span>
      </Link>

      {/* Desktop Nav Links */}
      <ul style={{ display: "flex", alignItems: "center", gap: "2.5rem", listStyle: "none" }}>
        {navLinks.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              style={{
                color: location.pathname === link.to ? "#e8edf5" : "#6b7a99",
                textDecoration: "none", fontSize: "0.9rem", fontWeight: 500,
                transition: "color 0.2s",
              }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Auth Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {user ? (
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.4rem 0.9rem",
              background: "rgba(61,255,192,0.08)",
              border: "1px solid rgba(61,255,192,0.2)",
              borderRadius: "100px", fontSize: "0.8rem",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3dffc0" }} />
              <span style={{ color: "#3dffc0", fontWeight: 500 }}>{user.full_name}</span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "0.5rem 1.2rem", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.07)",
                background: "transparent", color: "#6b7a99",
                fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem",
                cursor: "none", transition: "all 0.2s",
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button style={{
                padding: "0.5rem 1.2rem", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.07)",
                background: "transparent", color: "#6b7a99",
                fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", cursor: "none",
              }}>
                Sign In
              </button>
            </Link>
            <Link to="/login">
              <button style={{
                padding: "0.55rem 1.4rem", borderRadius: 8,
                background: "#3dffc0", color: "#080b12",
                border: "none", fontFamily: "DM Sans, sans-serif",
                fontWeight: 600, fontSize: "0.875rem", cursor: "none",
                boxShadow: "0 0 20px rgba(61,255,192,0.3)",
                transition: "all 0.25s",
              }}>
                Get Started
              </button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}