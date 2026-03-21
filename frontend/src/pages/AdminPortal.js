import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { useAI } from "../hooks/useAI";
import StatCard from "../components/dashbord/StatCard";
import AppTable from "../components/dashbord/AppTable";
import jobService from "../services/jobService";
import api from "../services/api";
import AdminFaceLock from "../components/common/AdminFaceLock";

// ── AdminPortal ───────────────────────────────────────
export default function AdminPortal() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { analyzeApplicant, bulkAnalyze, loading: aiLoading } = useAI();

  // ── Face Lock State ───────────────────────────────
  const [faceUnlocked, setFaceUnlocked] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0, totalApplications: 0, screened: 0, interviews: 0,
  });
  const [jobForm, setJobForm] = useState({
    title: "", description: "", department: "", location: "", employment_type: "full-time",
  });

  // ── Show Face Lock if not unlocked ───────────────
  if (!faceUnlocked) {
    return <AdminFaceLock onUnlock={() => setFaceUnlocked(true)} />;
  }

  // ── Fetch all jobs ────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const data = await jobService.getAll();
      setJobs(data);
      setStats({
        totalJobs: data.length,
        totalApplications: data.reduce((sum, j) => sum + (j.application_count || 0), 0),
        screened: data.reduce((sum, j) => sum + (j.screened_count || 0), 0),
        interviews: data.reduce((sum, j) => sum + (j.interview_count || 0), 0),
      });
    } catch (err) {
      toast.error("Failed to load jobs");
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    if (faceUnlocked) fetchJobs();
  }, [faceUnlocked, fetchJobs]);

  const fetchApplicants = useCallback(async (jobId) => {
    setLoadingApplicants(true);
    try {
      const data = await jobService.getRankedApplicants(jobId);
      setApplicants(data);
    } catch (err) {
      toast.error("Failed to load applicants");
    } finally {
      setLoadingApplicants(false);
    }
  }, []);

  useEffect(() => {
    if (selectedJob) fetchApplicants(selectedJob.id);
  }, [selectedJob, fetchApplicants]);

  const handleCreateJob = async () => {
    try {
      await jobService.create(jobForm);
      toast.success("Job posted successfully!");
      setShowJobModal(false);
      setJobForm({ title: "", description: "", department: "", location: "", employment_type: "full-time" });
      fetchJobs();
    } catch {
      toast.error("Failed to create job");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Delete this job? All applications will be removed.")) return;
    try {
      await jobService.delete(jobId);
      toast.success("Job deleted");
      if (selectedJob?.id === jobId) setSelectedJob(null);
      fetchJobs();
    } catch {
      toast.error("Failed to delete job");
    }
  };

  const handleStatusChange = async (applicantId, status) => {
    try {
      await api.patch(`/applicants/${applicantId}`, { status });
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicantId ? { ...a, status } : a))
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleAnalyze = async (applicantId) => {
    if (!selectedJob) return;
    const result = await analyzeApplicant(applicantId, selectedJob.id);
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

  const navItems = [
    { id: "overview",   icon: "📊", label: "Overview" },
    { id: "jobs",       icon: "💼", label: "Jobs" },
    { id: "applicants", icon: "👥", label: "Applicants" },
    { id: "analytics",  icon: "📈", label: "Analytics" },
  ];

  const sidebarItemStyle = (id) => ({
    display: "flex", alignItems: "center", gap: "0.7rem",
    padding: "0.6rem 0.8rem", borderRadius: 8,
    textDecoration: "none",
    color: activeTab === id ? "#3dffc0" : "#6b7a99",
    background: activeTab === id ? "rgba(61,255,192,0.08)" : "transparent",
    fontSize: "0.85rem", fontWeight: 500,
    cursor: "pointer", border: "none",
    width: "100%", textAlign: "left",
    transition: "all 0.2s",
  });

  const inputStyle = {
    width: "100%", padding: "0.7rem 0.9rem",
    background: "#080b12", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10, color: "#e8edf5",
    fontFamily: "DM Sans, sans-serif", fontSize: "0.875rem", outline: "none",
  };

  return (
    <div style={{ paddingTop: 70, display: "flex", minHeight: "100vh", background: "#080b12" }}>

      {/* ── Sidebar ───────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: "#0d1220",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        padding: "1.5rem 1rem",
        position: "sticky", top: 70,
        height: "calc(100vh - 70px)", overflowY: "auto",
      }}>
        {/* User info */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.7rem",
          padding: "0.8rem",
          background: "rgba(61,255,192,0.05)",
          border: "1px solid rgba(61,255,192,0.1)",
          borderRadius: 10, marginBottom: "1.5rem",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg,#3dffc0,#5b8dff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "0.8rem", color: "#080b12",
          }}>
            {user?.full_name?.charAt(0) || "A"}
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e8edf5" }}>{user?.full_name}</div>
            <div style={{ fontSize: "0.7rem", color: "#3dffc0", textTransform: "capitalize" }}>{user?.role}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={sidebarItemStyle(item.id)}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        {/* Lock button — पुन्हा face lock करण्यासाठी */}
        <div style={{ marginTop: "auto", paddingTop: "2rem" }}>
          <button
            onClick={() => setFaceUnlocked(false)}
            style={{
              width: "100%", padding: "0.6rem",
              background: "rgba(255,107,107,0.08)",
              border: "1px solid rgba(255,107,107,0.2)",
              borderRadius: 8, color: "#ff6b6b",
              fontSize: "0.8rem", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            }}
          >
            🔒 Lock Portal
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────── */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>

        {/* ── OVERVIEW ─────────────────────────── */}
        {activeTab === "overview" && (
          <div>
            <div style={{ marginBottom: "2rem" }}>
              <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.5rem" }}>
                Dashboard Overview
              </h1>
              <p style={{ color: "#6b7a99", fontSize: "0.875rem", marginTop: "0.3rem" }}>
                Welcome back, {user?.full_name?.split(" ")[0]}. 👋
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
              <StatCard label="Active Jobs"          value={stats.totalJobs}         change="↑ 3 this week"  changeType="up"   icon="💼" />
              <StatCard label="Total Applications"   value={stats.totalApplications} change="↑ 47 today"     changeType="up"   icon="📄" />
              <StatCard label="AI Screened"          value={stats.screened}          change="95.4% rate"     changeType="up"   icon="🤖" />
              <StatCard label="Interviews Scheduled" value={stats.interviews}        change="↓ 2 pending"    changeType="down" icon="📅" />
            </div>

            <div style={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>Recent Jobs</span>
                <button onClick={() => setActiveTab("jobs")} style={{ fontSize: "0.8rem", color: "#3dffc0", background: "none", border: "none", cursor: "pointer" }}>View all →</button>
              </div>
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  onClick={() => { setSelectedJob(job); setActiveTab("applicants"); }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3dffc0", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{job.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7a99" }}>{job.department}</div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7a99" }}>{job.application_count || 0} applicants</div>
                  <span style={{ padding: "0.2rem 0.7rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(61,255,192,0.1)", color: "#3dffc0" }}>Active</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── JOBS ─────────────────────────────── */}
        {activeTab === "jobs" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
              <div>
                <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.5rem" }}>Jobs</h1>
                <p style={{ color: "#6b7a99", fontSize: "0.875rem", marginTop: "0.3rem" }}>{jobs.length} active job postings</p>
              </div>
              {isAdmin && (
                <button onClick={() => setShowJobModal(true)} style={{ padding: "0.65rem 1.5rem", borderRadius: 10, background: "#3dffc0", color: "#080b12", border: "none", fontWeight: 600, cursor: "pointer" }}>
                  + Post New Job
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
              {jobs.map((job) => (
                <div key={job.id}
                  style={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.5rem", transition: "all 0.3s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(61,255,192,0.2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem" }}>
                    <div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, marginBottom: "0.2rem" }}>{job.title}</div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7a99" }}>{job.department} · {job.location}</div>
                    </div>
                    <span style={{ padding: "0.25rem 0.7rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 600, background: "rgba(61,255,192,0.1)", color: "#3dffc0", height: "fit-content" }}>Active</span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "#6b7a99", lineHeight: 1.6, marginBottom: "1.2rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {job.description}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "0.8rem", color: "#6b7a99" }}>{job.application_count || 0} applications</span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => { setSelectedJob(job); setActiveTab("applicants"); }} style={{ padding: "0.4rem 1rem", borderRadius: 8, background: "rgba(91,141,255,0.1)", border: "1px solid rgba(91,141,255,0.2)", color: "#5b8dff", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                        View Applicants
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDeleteJob(job.id)} style={{ padding: "0.4rem 0.8rem", borderRadius: 8, background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.15)", color: "#ff6b6b", fontSize: "0.8rem", cursor: "pointer" }}>🗑</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── APPLICANTS ───────────────────────── */}
        {activeTab === "applicants" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.5rem" }}>
                  {selectedJob ? `Applicants — ${selectedJob.title}` : "All Applicants"}
                </h1>
                <p style={{ color: "#6b7a99", fontSize: "0.875rem", marginTop: "0.3rem" }}>
                  {applicants.length} total · Sorted by AI match score
                </p>
              </div>
              {selectedJob && (
                <button onClick={() => bulkAnalyze(selectedJob.id)} disabled={aiLoading}
                  style={{ marginLeft: "auto", padding: "0.6rem 1.3rem", borderRadius: 10, background: "rgba(61,255,192,0.08)", border: "1px solid rgba(61,255,192,0.2)", color: "#3dffc0", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
                  {aiLoading ? "Analyzing…" : "✦ Bulk AI Analyze"}
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
              {jobs.map((job) => (
                <button key={job.id} onClick={() => setSelectedJob(job)}
                  style={{
                    padding: "0.4rem 1rem", borderRadius: "100px", whiteSpace: "nowrap",
                    border: `1px solid ${selectedJob?.id === job.id ? "rgba(61,255,192,0.3)" : "rgba(255,255,255,0.07)"}`,
                    background: selectedJob?.id === job.id ? "rgba(61,255,192,0.08)" : "transparent",
                    color: selectedJob?.id === job.id ? "#3dffc0" : "#6b7a99",
                    fontSize: "0.8rem", fontWeight: 500, cursor: "pointer",
                  }}>
                  {job.title}
                </button>
              ))}
            </div>

            <AppTable applicants={applicants} loading={loadingApplicants} onAnalyze={handleAnalyze} onStatusChange={handleStatusChange} />
          </div>
        )}

        {/* ── ANALYTICS ────────────────────────── */}
        {activeTab === "analytics" && (
          <div>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.5rem", marginBottom: "2rem" }}>Analytics</h1>
            <div style={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "3rem", textAlign: "center", color: "#6b7a99" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "#e8edf5", marginBottom: "0.5rem" }}>Analytics coming soon</div>
              <div style={{ fontSize: "0.875rem" }}>Charts and hiring insights will appear here once you have data.</div>
            </div>
          </div>
        )}
      </main>

      {/* ── New Job Modal ─────────────────────── */}
      {showJobModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={(e) => e.target === e.currentTarget && setShowJobModal(false)}>
          <div style={{ background: "#0d1220", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "2rem", width: 500, maxWidth: "90vw" }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.3rem", marginBottom: "0.4rem" }}>Post New Job</div>
            <div style={{ color: "#6b7a99", fontSize: "0.875rem", marginBottom: "1.5rem" }}>Fill in the details below.</div>

            {[
              { label: "Job Title", name: "title", placeholder: "e.g. Senior React Developer" },
              { label: "Department", name: "department", placeholder: "e.g. Engineering" },
              { label: "Location", name: "location", placeholder: "e.g. Mumbai / Remote" },
            ].map((f) => (
              <div key={f.name} style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#6b7a99", marginBottom: "0.4rem" }}>{f.label}</label>
                <input type="text" placeholder={f.placeholder} value={jobForm[f.name]}
                  onChange={(e) => setJobForm((p) => ({ ...p, [f.name]: e.target.value }))} style={inputStyle} />
              </div>
            ))}

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#6b7a99", marginBottom: "0.4rem" }}>Job Description</label>
              <textarea placeholder="Describe the role and requirements..." value={jobForm.description}
                onChange={(e) => setJobForm((p) => ({ ...p, description: e.target.value }))}
                rows={4} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowJobModal(false)} style={{ padding: "0.65rem 1.2rem", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.07)", color: "#6b7a99", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleCreateJob} style={{ padding: "0.65rem 1.5rem", borderRadius: 10, background: "#3dffc0", color: "#080b12", border: "none", fontWeight: 600, cursor: "pointer" }}>Post Job →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
