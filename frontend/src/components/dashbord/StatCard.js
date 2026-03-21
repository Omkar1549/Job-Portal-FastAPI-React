import React from "react";

// ── StatCard ──────────────────────────────────────────
// Displays a single metric tile in the dashboard overview
// Props:
//   label       — string: card heading (e.g. "Active Jobs")
//   value       — string | number: the main metric
//   change      — string: change indicator (e.g. "↑ 3 this week")
//   changeType  — "up" | "down" | "neutral"
//   icon        — emoji or ReactNode
//   accent      — optional custom color

export default function StatCard({
  label,
  value,
  change,
  changeType = "up",
  icon,
  accent = "#3dffc0",
}) {
  const changeColor = changeType === "up"
    ? "#3dffc0"
    : changeType === "down"
    ? "#ff6b6b"
    : "#6b7a99";

  return (
    <div
      style={{
        background: "#0d1220",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "1.2rem 1.3rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
        transition: "border-color 0.3s, transform 0.3s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${accent}33`;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.72rem", color: "#6b7a99", fontWeight: 500, letterSpacing: "0.04em" }}>
          {label}
        </span>
        {icon && (
          <span style={{
            width: 30, height: 30, borderRadius: 8,
            background: `${accent}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.9rem",
          }}>
            {icon}
          </span>
        )}
      </div>

      {/* Main value */}
      <div style={{
        fontFamily: "Syne, sans-serif",
        fontWeight: 800,
        fontSize: "1.8rem",
        letterSpacing: "-0.03em",
        color: "#e8edf5",
        lineHeight: 1,
        marginTop: "0.2rem",
      }}>
        {value}
      </div>

      {/* Change indicator */}
      {change && (
        <div style={{ fontSize: "0.72rem", color: changeColor, fontWeight: 500 }}>
          {change}
        </div>
      )}
    </div>
  );
}