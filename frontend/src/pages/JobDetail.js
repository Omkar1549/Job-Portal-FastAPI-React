import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jobService from "../services/jobService";
import { useAI } from "../hooks/useAI";
import AppTable from "../components/dashbord/AppTable";
import api from "../services/api";

// ── JobDetail Page ────────────────────────────────────
export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { analyzeApplicant, bulkAnalyze, loading: aiLoading } = useAI();

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [jobData, appsData] = await Promise.all([
          jobService.getById(jobId),
          jobService.getRankedApplicants(jobId),
        ]);
        setJob(jobData);
        setApplicants(appsData);
      } catch {
        navigate("/admin");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId, navigate]);

  const handleAnalyze = async (applicantId) => {
    const result = await analyzeApplicant(applicantId, jobId);
    if (result) {
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === applicantId
            ? { ...a, ai_match_score: result.score, ai_analysis: result.analysis }
            : a
        )
      );
    }
  };

  const handleStatusChange = async (applicantId, status) => {
    await api.patch(`/applicants/${applicantId}`, { status });
    setApplicants((prev) =>
      prev.map((a) => (a.id === applicantId ? { ...a, status } : a))
    );
  };

  if (loading || !job) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ color: "#3dffc0", fontFamily: "Syne, sans-serif", fontWeight: 700 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "6rem 4rem 4rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Back */}
      <button
        onClick={() => navigate("/admin")}
        style={{ background: "none", border: "none", color: "#6b7a99", cursor: "none", marginBottom: "1.5rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
      >
        ← Back to Admin
      </button>

      {/* Job header */}
      <div style={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "2rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.8rem", marginBottom: "0.5rem" }}>
              {job.title}
            </h1>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {[job.department, job.location, job.employment_type].filter(Boolean).map((tag) => (
                <span key={tag} style={{ padding: "0.25rem 0.7rem", borderRadius: "100px", background: "rgba(255,255,255,0.05)", color: "#6b7a99", fontSize: "0.8rem" }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => bulkAnalyze(jobId)}
            disabled={aiLoading}
            style={{ padding: "0.65rem 1.3rem", borderRadius: 10, background: "rgba(61,255,192,0.08)", border: "1px solid rgba(61,255,192,0.2)", color: "#3dffc0", fontWeight: 600, fontSize: "0.875rem", cursor: "none" }}
          >
            {aiLoading ? "Analyzing…" : "✦ Bulk AI Analyze"}
          </button>
        </div>
        <p style={{ marginTop: "1.2rem", color: "#6b7a99", lineHeight: 1.7, fontSize: "0.9rem" }}>
          {job.description}
        </p>
      </div>

      {/* Applicants table */}
      <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>
          Applicants ({applicants.length})
        </h2>
      </div>
      <AppTable
        applicants={applicants}
        loading={loading}
        onAnalyze={handleAnalyze}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}