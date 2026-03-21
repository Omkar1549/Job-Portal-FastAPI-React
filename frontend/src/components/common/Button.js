import React from "react";

// ── Button Variants ───────────────────────────────────
// variant: "primary" | "ghost" | "danger" | "outline"
// size:    "sm" | "md" | "lg"
// loading: boolean — shows spinner, disables interaction

const styles = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    fontFamily: "DM Sans, sans-serif",
    fontWeight: 500,
    borderRadius: "10px",
    cursor: "none",
    transition: "all 0.25s ease",
    border: "none",
    outline: "none",
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  },
  sizes: {
    sm: { padding: "0.4rem 1rem", fontSize: "0.8rem" },
    md: { padding: "0.6rem 1.4rem", fontSize: "0.875rem" },
    lg: { padding: "0.85rem 2rem", fontSize: "1rem", borderRadius: "12px" },
  },
  variants: {
    primary: {
      background: "#3dffc0",
      color: "#080b12",
      fontWeight: 600,
      boxShadow: "0 0 20px rgba(61,255,192,0.3)",
    },
    ghost: {
      background: "transparent",
      color: "#6b7a99",
      border: "1px solid rgba(255,255,255,0.07)",
    },
    danger: {
      background: "rgba(255,107,107,0.1)",
      color: "#ff6b6b",
      border: "1px solid rgba(255,107,107,0.2)",
    },
    outline: {
      background: "transparent",
      color: "#3dffc0",
      border: "1px solid rgba(61,255,192,0.3)",
    },
  },
  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

// ── Spinner ───────────────────────────────────────────
function Spinner() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  type = "button",
  style: extraStyle = {},
  icon,
}) {
  const isDisabled = disabled || loading;

  const computedStyle = {
    ...styles.base,
    ...styles.sizes[size],
    ...styles.variants[variant],
    ...(isDisabled ? styles.disabled : {}),
    ...extraStyle,
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      style={computedStyle}
    >
      {loading ? <Spinner /> : icon && <span>{icon}</span>}
      {children}
    </button>
  );
}