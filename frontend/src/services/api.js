import axios from 'axios';

export const API_BASE = 'http://127.0.0.1:8001';

const api = axios.create({
  baseURL: API_BASE,
});

const postCandidateAction = async (path, candidateId) => {
  const response = await fetch(`${API_BASE}${path}/${candidateId}`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || 'Candidate action failed.');
  }

  return data;
};

export const applyForJob = async (formData) => {
  const response = await api.post('/apply', formData);
  return response;
};

export const getApplicants = async () => {
  const response = await api.get('/get-applicants');
  return response.data;
};

export const getDashboard = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export const updateStatus = async (candidateId, newStatus) => {
  const response = await api.put('/update-status', {
    candidate_id: candidateId,
    status: newStatus,
  });
  return response.data;
};

export const shortlistCandidate = async (candidateId) => {
  return postCandidateAction('/candidate/shortlist', candidateId);
};

export const rejectCandidate = async (candidateId) => {
  return postCandidateAction('/candidate/reject', candidateId);
};

export const interviewCandidate = async (candidateId) => {
  return postCandidateAction('/candidate/interview', candidateId);
};

export const runCandidateAction = async (candidateId, status) => {
  const actionByStatus = {
    shortlisted: shortlistCandidate,
    rejected: rejectCandidate,
    interview: interviewCandidate,
  };

  const action = actionByStatus[status];

  if (!action) {
    return updateStatus(candidateId, status);
  }

  return action(candidateId);
};

export const aiRankCandidates = async (query) => {
  const response = await api.get(`/ai-rank-candidates?query=${encodeURIComponent(query)}`);
  return response.data;
};

export const chatWithRecruiter = async (query) => {
  const response = await api.post('/chatbot', { query });
  return response.data;
};

export const getResumeUrl = (filename) => {
  return `${API_BASE}/resume/${encodeURIComponent(filename)}`;
};

export default api;
