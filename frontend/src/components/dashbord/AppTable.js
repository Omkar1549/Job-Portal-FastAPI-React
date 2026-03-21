import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Match Score Badge ─────────────────────────────────
function ScoreBadge({ score }) {
  const color = score >= 80 ? "#3dffc0" : score >= 60 ? "#5b8dff" : "#ff6b6b";
  const bg = score >= 80
    ? "rgba(61,255,192,0.1)"
    : score >= 60
    ? "rgba(91,141,255,0.1)"
    : "rgba(255,107,107,0.1)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {/* Mini progress bar */}
      <div style={{
        width: 60, height: 4, background: "rgba(255,255,255,0.07)",
        borderRadius: 2, overflow: "hidden",
      }}>
        <div style={{
          width: `${score}%`, height: "100%",
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: 2,
          transition: "width 0.5s ease",
        }} />
      </div>
      <span style={{
        padding: "0.2rem 0.6rem", borderRadius: "100px",
        fontSize: "0.72rem", fontWeight: 700,
        background: bg, color,
      }}>
        {score}%
      </span>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:    { color: "#6b7a99", bg: "rgba(107,122,153,0.1)", label: "Pending" },
    reviewed:   { color: "#5b8dff", bg: "rgba(91,141,255,0.1)",  label: "Reviewed" },
    shortlisted:{ color: "#3dffc0", bg: "rgba(61,255,192,0.1)",  label: "Shortlisted" },
    rejected:   { color: "#ff6b6b", bg: "rgba(255,107,107,0.1)", label: "Rejected" },
    hired:      { color: "#ffd93d", bg: "rgba(255,217,61,0.1)",  label: "Hired 🎉" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      padding: "0.25rem 0.7rem", borderRadius: "100px",
      fontSize: "0.72rem", fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────
function Avatar({ name }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Deterministic color from name
  const colors = [
    ["#3dffc0", "#5b8dff"],
    ["#5b8dff", "#ff6b6b"],
    ["#ff6b6b", "#ffd93d"],
    ["#ffd93d", "#3dffc0"],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  const [c1, c2] = colors[idx];

  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: "0.75rem", color: "#080b12",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── AppTable ──────────────────────────────────────────
// Props:
//   applicants  — array of applicant objects
//   onAnalyze   — (applicantId) => void: triggers AI analysis
//   onStatusChange — (applicantId, newStatus) => void
//   loading     — boolean: skeleton loading state

export default function AppTable({ applicants = [], onAnalyze, onStatusChange, loading }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState("ai_match_score");
  const [sortDir, setSortDir] = useState("desc");

  // ── Sorting ───────────────────────────────────────
  const sorted = [...applicants].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    if (typeof av === "string") {
      return sortDir === "asc"
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    }
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span style={{ opacity: 0.3 }}>↕</span>;
    return <span style={{ color: "#3dffc0" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const headerStyle = {
    padding: "0.7rem 1rem",
    fontSize: "0.72rem", fontWeight: 700,
    letterSpacing: "0.06em", textTransform: "uppercase",
    color: "#6b7a99",
    textAlign: "left",
    cursor: "none",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  const cellStyle = {
    padding: "0.85rem 1rem",
    fontSize: "0.85rem",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    verticalAlign: "middle",
  };

  // ── Skeleton rows while loading ───────────────────
  if (loading) {
    return (
      <div style={{
        background: "#0d1220", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, overflow: "hidden",
      }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            height: 64,
            background: `rgba(255,255,255,${0.01 + i * 0.005})`,
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            animation: "shimmer 1.5s infinite",
          }} />
        ))}
        <style>{`
          @keyframes shimmer {
            0%,100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!applicants.length) {
    return (
      <div style={{
        background: "#0d1220", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: "3rem",
        textAlign: "center", color: "#6b7a99",
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>No applicants yet</div>
        <div style={{ fontSize: "0.85rem", marginTop: "0.3rem" }}>
          Share the job link to start collecting applications.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#0d1220",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, overflow: "hidden",
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#080b12" }}>
          <tr>
            <th style={headerStyle} onClick={() => toggleSort("full_name")}>
              Applicant <SortIcon col="full_name" />
            </th>
            <th style={headerStyle}>Resume</th>
            <th style={headerStyle} onClick={() => toggleSort("ai_match_score")}>
              AI Score <SortIcon col="ai_match_score" />
            </th>
            <th style={headerStyle} onClick={() => toggleSort("status")}>
              Status <SortIcon col="status" />
            </th>
            <th style={headerStyle} onClick={() => toggleSort("applied_at")}>
              Applied <SortIcon col="applied_at" />
            </th>
            <th style={headerStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((app) => (
            <tr
              key={app.id}
              style={{ transition: "background 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Name + email */}
              <td style={cellStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <Avatar name={app.full_name} />
                  <div>
                    <div style={{ fontWeight: 600, color: "#e8edf5" }}>{app.full_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7a99" }}>{app.email}</div>
                  </div>
                </div>
              </td>

              {/* Resume link */}
              <td style={cellStyle}>
                {app.resume_path ? (
                  <a
                    href={`${process.env.REACT_APP_API_URL}/uploads/${app.resume_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.3rem",
                      fontSize: "0.78rem", color: "#5b8dff",
                      textDecoration: "none", fontWeight: 500,
                    }}
                  >
                    📄 View PDF
                  </a>
                ) : (
                  <span style={{ color: "#6b7a99", fontSize: "0.78rem" }}>No file</span>
                )}
              </td>

              {/* AI Score */}
              <td style={cellStyle}>
                {app.ai_match_score != null ? (
                  <ScoreBadge score={app.ai_match_score} />
                ) : (
                  <button
                    onClick={() => onAnalyze?.(app.id)}
                    style={{
                      padding: "0.3rem 0.8rem", borderRadius: 6,
                      background: "rgba(61,255,192,0.08)",
                      border: "1px solid rgba(61,255,192,0.2)",
                      color: "#3dffc0", fontSize: "0.75rem",
                      fontWeight: 600, cursor: "none",
                    }}
                  >
                    ✦ Analyze
                  </button>
                )}
              </td>

              {/* Status dropdown */}
              <td style={cellStyle}>
                <select
                  value={app.status || "pending"}
                  onChange={(e) => onStatusChange?.(app.id, e.target.value)}
                  style={{
                    background: "#080b12",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 8, padding: "0.3rem 0.6rem",
                    color: "#e8edf5", fontSize: "0.8rem",
                    fontFamily: "DM Sans, sans-serif", cursor: "none",
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                  <option value="hired">Hired</option>
                </select>
              </td>

              {/* Applied date */}
              <td style={{ ...cellStyle, color: "#6b7a99", fontSize: "0.8rem" }}>
                {app.applied_at
                  ? new Date(app.applied_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })
                  : "—"}
              </td>

              {/* Action buttons */}
              <td style={cellStyle}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => navigate(`/applicants/${app.id}`)}
                    style={{
                      padding: "0.3rem 0.7rem", borderRadius: 6,
                      background: "rgba(91,141,255,0.1)",
                      border: "1px solid rgba(91,141,255,0.2)",
                      color: "#5b8dff", fontSize: "0.75rem",
                      fontWeight: 600, cursor: "none",
                    }}
                  >
                    View
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}