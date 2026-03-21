import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAI } from "../hooks/useAI";
import api from "../services/api";

// ── Score Ring Component ──────────────────────────────
function ScoreRing({ score }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#3dffc0" : score >= 60 ? "#5b8dff" : "#ff6b6b";

  return (
    <div style={{ position: "relative", width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.3rem", color }}>{score}</div>
        <div style={{ fontSize: "0.55rem", color: "#6b7a99", letterSpacing: "0.05em" }}>SCORE</div>
      </div>
    </div>
  );
}

// ── ApplicantDetail Page ──────────────────────────────
export default function ApplicantDetail() {
  const { applicantId } = useParams();
  const navigate = useNavigate();
  const { analyzeApplicant, getAnalysis, loading: aiLoading } = useAI();

  const [applicant, setApplicant] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load applicant + existing analysis
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [appData, aiData] = await Promise.all([
          api.get(`/applicants/${applicantId}`).then((r) => r.data),
          getAnalysis(applicantId),
        ]);
        setApplicant(appData);
        if (aiData) setAnalysis(aiData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [applicantId]);

  const handleRunAnalysis = async () => {
    if (!applicant?.job_id) return;
    const result = await analyzeApplicant(applicantId, applicant.job_id);
    if (result) setAnalysis(result);
  };

  const handleStatusChange = async (newStatus) => {
    await api.patch(`/applicants/${applicantId}`, { status: newStatus });
    setApplicant((a) => ({ ...a, status: newStatus }));
  };

  if (loading || !applicant) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ color: "#3dffc0", fontFamily: "Syne, sans-serif", fontWeight: 700 }}>Loading…</div>
      </div>
    );
  }

  const statusColors = {
    pending:     { bg: "rgba(107,122,153,0.1)", color: "#6b7a99" },
    reviewed:    { bg: "rgba(91,141,255,0.1)",  color: "#5b8dff" },
    shortlisted: { bg: "rgba(61,255,192,0.1)",  color: "#3dffc0" },
    rejected:    { bg: "rgba(255,107,107,0.1)", color: "#ff6b6b" },
    hired:       { bg: "rgba(255,217,61,0.1)",  color: "#ffd93d" },
  };
  const sc = statusColors[applicant.status] || statusColors.pending;

  return (
    <div style={{ padding: "6rem 4rem 4rem", maxWidth: 1000, margin: "0 auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: "none", border: "none", color: "#6b7a99", cursor: "none", marginBottom: "1.5rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
      >
        ← Back
      </button>

      {/* Header card */}
      <div style={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
        {/* Avatar */}
        <div style={{ width: 70, height: 70, borderRadius: "50%", background: "linear-gradient(135deg,#3dffc0,#5b8dff)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.5rem", color: "#080b12", flexShrink: 0 }}>
          {applicant.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.6rem", marginBottom: "0.3rem" }}>
            {applicant.full_name}
          </h1>
          <div style={{ color: "#6b7a99", fontSize: "0.9rem" }}>{applicant.email}</div>
          {applicant.phone && <div style={{ color: "#6b7a99", fontSize: "0.85rem" }}>{applicant.phone}</div>}
        </div>

        {/* Score ring */}
        {analysis?.score != null && <ScoreRing score={analysis.score} />}

        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", alignItems: "flex-end" }}>
          <select
            value={applicant.status || "pending"}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{ padding: "0.5rem 0.8rem", borderRadius: 8, background: sc.bg, border: `1px solid ${sc.color}44`, color: sc.color, fontFamily: "DM Sans, sans-serif", fontWeight: 600, cursor: "none" }}
          >
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="hired">Hired</option>
          </select>

          {applicant.resume_path && (
            <a
              href={`${process.env.REACT_APP_API_URL}/uploads/${applicant.resume_path}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "0.5rem 1rem", borderRadius: 8, background: "rgba(91,141,255,0.1)", border: "1px solid rgba(91,141,255,0.2)", color: "#5b8dff", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}
            >
              📄 View Resume PDF
            </a>
          )}
        </div>
      </div>

      {/* AI Analysis section */}
      <div style={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#3dffc0,#5b8dff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>✦</div>
            <div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>AI Analysis</div>
              <div style={{ fontSize: "0.75rem", color: "#6b7a99" }}>Powered by Gemini AI</div>
            </div>
          </div>
          <button
            onClick={handleRunAnalysis}
            disabled={aiLoading}
            style={{ padding: "0.55rem 1.2rem", borderRadius: 10, background: "rgba(61,255,192,0.08)", border: "1px solid rgba(61,255,192,0.2)", color: "#3dffc0", fontWeight: 600, fontSize: "0.875rem", cursor: "none" }}
          >
            {aiLoading ? "Analyzing…" : analysis ? "Re-analyze" : "✦ Run Analysis"}
          </button>
        </div>

        {analysis ? (
          <>
            {/* AI text */}
            <div style={{ background: "#080b12", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.2rem 1.5rem", marginBottom: "1.5rem", fontSize: "0.9rem", color: "#6b7a99", lineHeight: 1.8 }}>
              <div dangerouslySetInnerHTML={{ __html: analysis.analysis?.replace(/\n/g, "<br/>") }} />
            </div>

            {/* Skill tags */}
            {analysis.skill_breakdown && (
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6b7a99", marginBottom: "0.8rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Skill Match Breakdown
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {analysis.skill_breakdown.matched?.map((s) => (
                    <span key={s} style={{ padding: "0.3rem 0.8rem", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 600, background: "rgba(61,255,192,0.08)", color: "#3dffc0", border: "1px solid rgba(61,255,192,0.25)" }}>
                      ✓ {s}
                    </span>
                  ))}
                  {analysis.skill_breakdown.partial?.map((s) => (
                    <span key={s} style={{ padding: "0.3rem 0.8rem", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 600, background: "rgba(91,141,255,0.08)", color: "#5b8dff", border: "1px solid rgba(91,141,255,0.25)" }}>
                      ~ {s}
                    </span>
                  ))}
                  {analysis.skill_breakdown.missing?.map((s) => (
                    <span key={s} style={{ padding: "0.3rem 0.8rem", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 500, background: "transparent", color: "#6b7a99", border: "1px solid rgba(255,255,255,0.07)" }}>
                      ✗ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", color: "#6b7a99" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.8rem" }}>🤖</div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#e8edf5", marginBottom: "0.4rem" }}>No analysis yet</div>
            <div style={{ fontSize: "0.85rem" }}>Click "Run Analysis" to get AI-powered insights on this candidate.</div>
          </div>
        )}
      </div>
    </div>
  );
}