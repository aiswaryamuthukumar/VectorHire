import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  BrainCircuit,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Search,
  Users,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getResumeUrl, runCandidateAction } from '../../services/api';

const statusLabel = (status) => (status || 'pending').replace('_', ' ');

const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="h-32 bg-gray-100 rounded-2xl" />
      ))}
    </div>
    <div className="h-80 bg-gray-100 rounded-3xl" />
  </div>
);

const MetricCard = ({ label, value, icon: Icon }) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
    <div className="flex items-center justify-between mb-5">
      <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E11D48]">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-3xl font-black text-gray-900">{value}</span>
    </div>
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  const normalized = status || 'pending';
  const color =
    normalized === 'shortlisted'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : normalized === 'rejected'
        ? 'bg-red-50 text-red-700 border-red-200'
        : normalized === 'interview'
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <span className={`inline-flex px-3 py-1 rounded-lg border text-xs font-bold capitalize ${color}`}>
      {statusLabel(normalized)}
    </span>
  );
};

const CandidatePanel = ({ candidate, onClose, onStatusUpdate, updating }) => {
  if (!candidate) return null;

  const evidence = candidate.evidence || candidate.retrieved_strengths || [];
  const score = candidate.semantic_score ?? candidate.average_similarity;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 60, opacity: 0 }}
        className="relative z-10 w-full max-w-xl h-[calc(100vh-2rem)] bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{candidate.name || 'Unnamed Candidate'}</h2>
            <p className="text-sm font-medium text-gray-500 mt-1">{candidate.role || 'Role unavailable'}</p>
            <div className="mt-3"><StatusBadge status={candidate.status} /></div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-[#E11D48]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Semantic Score</p>
              <p className="text-3xl font-black text-[#E11D48] mt-2">{score ?? '--'}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Matched Chunks</p>
              <p className="text-3xl font-black text-gray-900 mt-2">{candidate.matched_chunks ?? 0}</p>
            </div>
          </div>

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#E11D48]" /> Retrieved RAG Explanation
            </h3>
            {evidence.length > 0 ? (
              <div className="space-y-3">
                {evidence.map((item, index) => (
                  <p key={index} className="rounded-2xl bg-red-50/60 border border-red-100 p-4 text-sm leading-relaxed text-gray-700">
                    {item}
                  </p>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6 text-sm text-gray-400 italic">
                No semantic matches available.
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recruiter Notes</h3>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-6 text-sm text-gray-400 italic">
              No recruiter notes available.
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onStatusUpdate(candidate.id, 'shortlisted')} disabled={updating} className="py-3 rounded-xl bg-[#E11D48] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />} Accept
            </button>
            <button onClick={() => onStatusUpdate(candidate.id, 'rejected')} disabled={updating} className="py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button onClick={() => onStatusUpdate(candidate.id, 'interview')} disabled={updating} className="py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              <Calendar className="w-4 h-4" /> Interview
            </button>
            <button onClick={() => onStatusUpdate(candidate.id, 'pending')} disabled={updating} className="py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              <Clock className="w-4 h-4" /> Pending
            </button>
          </div>

          {candidate.resume_filename && (
            <button onClick={() => window.open(getResumeUrl(candidate.resume_filename), '_blank')} className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> View Resume
            </button>
          )}
        </div>
      </motion.aside>
    </div>
  );
};

const RecruiterDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const fetchDashboard = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      setDashboard(await getDashboard());
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to load dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(true);
    const interval = window.setInterval(() => fetchDashboard(false), 10000);
    return () => window.clearInterval(interval);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2600);
  };

  const handleStatusUpdate = async (candidateId, status) => {
    if (candidateId === undefined || candidateId === null) return showToast('Candidate id is missing.', 'error');
    setUpdatingId(candidateId);
    try {
      const response = await runCandidateAction(candidateId, status);
      const updated = response.updated_data;
      setSelectedCandidate((current) => (current?.id === candidateId ? { ...current, ...updated } : current));
      await fetchDashboard(false);

      if (response.email?.error) {
        showToast(`Candidate moved to ${status}. Email failed to send.`, 'error');
      } else if (response.email?.sent) {
        showToast(`Candidate moved to ${status}. Email sent.`);
      } else {
        showToast(`Candidate moved to ${status}.`);
      }
    } catch (error) {
      showToast(error?.response?.data?.detail || error?.message || 'Failed to update status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = dashboard?.counts || {};
  const feed = dashboard?.live_application_feed || [];
  const semanticInsights = dashboard?.semantic_match_insights || [];

  const metrics = useMemo(() => [
    { label: 'Total Candidates', value: counts.total_candidates || 0, icon: Users },
    { label: 'Pending Review', value: counts.pending_review || 0, icon: Clock },
    { label: 'AI Reviewed', value: counts.ai_reviewed || 0, icon: Bot },
    { label: 'Shortlisted', value: counts.shortlisted || 0, icon: UserCheck },
    { label: 'Rejected', value: counts.rejected || 0, icon: XCircle },
    { label: 'Interview Scheduled', value: counts.interview_scheduled || 0, icon: Calendar },
  ], [counts]);

  return (
    <div className="max-w-[1600px] mx-auto h-full px-4 lg:px-8 pb-8 overflow-y-auto">
      {toast && (
        <div className={`fixed top-6 right-6 z-[120] px-4 py-3 rounded-xl shadow-lg border text-sm font-bold ${toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {toast.message}
        </div>
      )}

      <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2.5 flex items-center gap-3">
            <span className="p-2 bg-red-50 rounded-xl text-[#E11D48] border border-red-100 shadow-sm"><Search className="w-6 h-6" /></span>
            Intelligent<span className="text-[#E11D48]">Workspace</span>
          </h1>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
            <section className="bg-white border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#E11D48]" /> Live Application Feed
                </h2>
                <button onClick={() => navigate('/recruiter/applicants')} className="text-sm font-bold text-[#E11D48] flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {feed.length > 0 ? feed.map((applicant) => (
                  <button key={applicant.id} onClick={() => setSelectedCandidate(applicant)} className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E11D48] font-bold">
                        {(applicant.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{applicant.name || 'Unnamed Candidate'}</h3>
                        <p className="text-sm text-gray-500">{applicant.role || 'Role unavailable'}</p>
                      </div>
                    </div>
                    <StatusBadge status={applicant.status} />
                  </button>
                )) : (
                  <div className="p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No candidates found</h3>
                    <p className="text-sm text-gray-500">Applications from Supabase will appear here.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white border border-gray-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[#E11D48]" /> Semantic Match Insights
              </h2>
              {semanticInsights.length > 0 ? (
                <div className="space-y-3">
                  {semanticInsights.map((insight, index) => (
                    <div key={index} className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-700">
                      {insight}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 text-center">
                  <BrainCircuit className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-1">No semantic matches available</h3>
                  <p className="text-sm text-gray-500">Run a search in AI Recruiter to retrieve indexed resume matches.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedCandidate && (
          <CandidatePanel
            candidate={selectedCandidate}
            onClose={() => setSelectedCandidate(null)}
            onStatusUpdate={handleStatusUpdate}
            updating={updatingId === selectedCandidate.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecruiterDashboard;
