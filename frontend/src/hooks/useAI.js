import { useState, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

// ── useAI Hook ────────────────────────────────────────
// Handles all AI-related API calls:
//   - Triggering AI match analysis for an applicant
//   - Fetching cached AI results
//   - Re-running analysis

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  // ── Analyze a single applicant against a job ──────
  // Calls POST /applicants/:id/analyze
  // Backend calls ai_service.py → Gemini API → returns score + breakdown
  const analyzeApplicant = useCallback(async (applicantId, jobId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/applicants/${applicantId}/analyze`, {
        job_id: jobId,
      });
      setAnalysisResult(response.data);
      toast.success("AI analysis complete!");
      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || "AI analysis failed";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Bulk analyze all applicants for a job ─────────
  // Calls POST /jobs/:jobId/analyze-all
  // Queues async processing — returns job_id for polling
  const bulkAnalyze = useCallback(async (jobId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/jobs/${jobId}/analyze-all`);
      toast.success("Bulk analysis started! Results will appear shortly.");
      return response.data; // { message, processed_count, job_id }
    } catch (err) {
      const message = err.response?.data?.detail || "Bulk analysis failed";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch existing AI analysis for an applicant ───
  // Calls GET /applicants/:id/analysis
  const getAnalysis = useCallback(async (applicantId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/applicants/${applicantId}/analysis`);
      setAnalysisResult(response.data);
      return response.data;
    } catch (err) {
      // 404 means not analyzed yet — not an error worth toasting
      if (err.response?.status !== 404) {
        const message = err.response?.data?.detail || "Failed to fetch analysis";
        setError(message);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Clear analysis state ──────────────────────────
  const clearAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
  }, []);

  return {
    loading,
    analysisResult,
    error,
    analyzeApplicant,
    bulkAnalyze,
    getAnalysis,
    clearAnalysis,
  };
}