import api from "./api";

// ── Job Service ───────────────────────────────────────
// Wraps all /jobs API endpoints for clean component usage

const jobService = {
  // GET /jobs — list all jobs (with optional filters)
  getAll: async (params = {}) => {
    const response = await api.get("/jobs", { params });
    return response.data; // Array of JobOut schemas
  },

  // GET /jobs/:id — single job detail
  getById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  // POST /jobs — create new job (admin only)
  create: async (jobData) => {
    // jobData: { title, description, department, requirements, location, employment_type }
    const response = await api.post("/jobs", jobData);
    return response.data;
  },

  // PUT /jobs/:id — update job (admin only)
  update: async (id, jobData) => {
    const response = await api.put(`/jobs/${id}`, jobData);
    return response.data;
  },

  // DELETE /jobs/:id — delete job (admin only)
  delete: async (id) => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },

  // GET /jobs/:id/applicants — all applicants for a job
  getApplicants: async (jobId) => {
    const response = await api.get(`/jobs/${jobId}/applicants`);
    return response.data;
  },

  // GET /jobs/:id/applicants/ranked — AI-ranked applicants
  getRankedApplicants: async (jobId) => {
    const response = await api.get(`/jobs/${jobId}/applicants/ranked`);
    return response.data; // Sorted by ai_match_score descending
  },
};

export default jobService;