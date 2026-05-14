import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  BrainCircuit,
  Database,
  FileText,
  Loader2,
  MessageSquare,
  Network,
  Search,
  Send,
  UploadCloud,
  User,
  X,
} from 'lucide-react';
import { chatWithRecruiter, getResumeUrl } from '../../services/api';

const EMPTY_MESSAGE = 'No matching candidates found in the indexed talent database.';

const Workflow = () => (
  <div className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
    <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center gap-2">
      <BrainCircuit className="w-5 h-5 text-[#E11D48]" /> RAG Retrieval Pipeline
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Query Embedding', icon: Database },
        { label: 'Vector Search', icon: Network },
        { label: 'Resume Context', icon: FileText },
        { label: 'LLM Answer', icon: Bot },
      ].map((item) => (
        <div key={item.label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center">
          <item.icon className="w-6 h-6 text-[#E11D48] mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.label}</p>
        </div>
      ))}
    </div>
  </div>
);

const CandidateResult = ({ candidate }) => {
  const evidence = candidate.evidence || [];
  const score = candidate.semantic_score ?? candidate.average_similarity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h4 className="text-lg font-bold text-gray-900">{candidate.name || 'Unnamed Candidate'}</h4>
          <p className="text-sm font-medium text-gray-500">{candidate.role || 'Role unavailable'}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#E11D48]">{score ?? '--'}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Semantic Score</p>
        </div>
      </div>

      <div className="space-y-3">
        {evidence.length > 0 ? evidence.map((chunk, index) => (
          <p key={index} className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-600 leading-relaxed line-clamp-4">
            {chunk}
          </p>
        )) : (
          <p className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-400 italic">
            No resume insights available.
          </p>
        )}
      </div>

      {candidate.resume_filename && (
        <button onClick={() => window.open(getResumeUrl(candidate.resume_filename), '_blank')} className="mt-5 w-full py-3 rounded-xl bg-gray-900 text-white font-bold flex items-center justify-center gap-2">
          <FileText className="w-4 h-4" /> View Resume
        </button>
      )}
    </motion.div>
  );
};

const AIRecruiter = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jdFileName, setJdFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', content: 'Ask a recruiting query or paste a job description. I will answer only from indexed resume retrieval.' },
  ]);

  const runRecruiterSearch = async (searchText, source = 'chat') => {
    const currentQuery = searchText.trim();
    if (!currentQuery || loading) return;

    if (source === 'chat') {
      setQuery('');
    }

    if (source === 'jd') {
      setJobDescription('');
      setJdFileName('');
    }

    setLoading(true);
    setChatHistory((prev) => [...prev, {
      role: 'user',
      content: source === 'jd' ? `Job description search:\n\n${currentQuery}` : currentQuery
    }]);

    try {
      const response = await chatWithRecruiter(currentQuery);
      const candidates = Array.isArray(response.candidates) ? response.candidates : [];
      const truthfulAnswer = response.answer || (candidates.length === 0 ? EMPTY_MESSAGE : '');

      setResults(candidates);
      setAnswer(truthfulAnswer);
      setChatHistory((prev) => [...prev, { role: 'ai', content: truthfulAnswer }]);
    } catch (error) {
      const message = error?.response?.data?.detail || 'Unable to retrieve candidates from the backend.';
      setResults([]);
      setAnswer(message);
      setChatHistory((prev) => [...prev, { role: 'ai', content: message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event) => {
    event?.preventDefault();
    runRecruiterSearch(query, 'chat');
  };

  const handleJobDescriptionSearch = async (event) => {
    event?.preventDefault();
    runRecruiterSearch(jobDescription, 'jd');
  };

  const handleJobDescriptionFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setFileError('');

    if (!file) return;

    const readableTypes = [
      'text/plain',
      'text/markdown',
      'application/json',
    ];

    const isReadableText =
      readableTypes.includes(file.type) ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json');

    if (!isReadableText) {
      setFileError('Upload a text-based JD file, or paste the job description into the box.');
      return;
    }

    try {
      const text = await file.text();
      setJobDescription(text);
      setJdFileName(file.name);
    } catch (error) {
      setFileError('Unable to read this job description file.');
    }
  };

  return (
    <div className="h-full flex flex-col max-w-[1600px] mx-auto px-2 lg:px-4 pb-4 relative">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2 flex items-center gap-3">
            <span className="p-2.5 bg-red-50 rounded-2xl text-[#E11D48] border border-red-100 shadow-sm">
              <Bot className="w-6 h-6" />
            </span>
            AIRecruitment<span className="text-[#E11D48]">Workspace</span>
          </h1>
          <p className="text-[#BE123C] font-medium ml-1">Backend-driven semantic talent discovery.</p>
        </div>
      </div>

      <div className="flex-grow min-h-0 overflow-y-auto pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <Workflow />

          {loading ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <Loader2 className="w-10 h-10 animate-spin text-[#E11D48] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Retrieving indexed resume context</h2>
            </div>
          ) : answer ? (
            <section className="space-y-5">
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">RAG Answer</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{answer}</p>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {results.map((candidate) => <CandidateResult key={candidate.id || candidate.resume_filename} candidate={candidate} />)}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900">No candidates found</h3>
                </div>
              )}
            </section>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Start a semantic search</h2>
              <p className="text-gray-500 mt-2">Results will appear only when the backend retrieves matching indexed resumes.</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="mb-6 w-[450px] max-w-[calc(100vw-2rem)] h-[650px] max-h-[calc(100vh-140px)] flex flex-col bg-gray-950 rounded-[2rem] shadow-[0_20px_60px_rgb(0,0,0,0.3)] overflow-hidden text-white border border-white/10"
            >
              <div className="p-5 border-b border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Bot className="w-5 h-5 text-[#E11D48]" />
                  <h3 className="font-bold">RAG Recruiter Chat</h3>
                </div>
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      activeTab === 'chat' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" /> Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('jd')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      activeTab === 'jd' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Job Description
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                {activeTab === 'chat' ? (
                  <>
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#E11D48]/20' : 'bg-white/5'}`}>
                          {msg.role === 'user' ? <User className="w-4 h-4 text-[#E11D48]" /> : <Bot className="w-4 h-4 text-gray-300" />}
                        </div>
                        <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user' ? 'bg-[#E11D48] text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {loading && <Loader2 className="w-5 h-5 animate-spin text-[#E11D48]" />}
                  </>
                ) : (
                  <form onSubmit={handleJobDescriptionSearch} className="h-full flex flex-col gap-4">
                    <textarea
                      value={jobDescription}
                      onChange={(event) => {
                        setJobDescription(event.target.value);
                        setFileError('');
                      }}
                      placeholder="Paste the full job description here. This text will be used as the semantic query against indexed resumes."
                      className="w-full flex-1 min-h-[330px] p-5 bg-white/5 border border-white/10 rounded-3xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white placeholder-gray-500 transition-all resize-none"
                      disabled={loading}
                    />
                    {jdFileName && (
                      <div className="text-xs font-bold text-gray-300 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                        Loaded: {jdFileName}
                      </div>
                    )}
                    {fileError && (
                      <div className="text-xs font-bold text-red-200 bg-[#E11D48]/20 border border-[#E11D48]/30 rounded-xl px-4 py-2">
                        {fileError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="cursor-pointer border border-white/10 bg-white/5 text-gray-300 py-3 px-4 rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2 font-bold text-sm">
                        <UploadCloud className="w-4 h-4" /> Upload JD
                        <input
                          type="file"
                          accept=".txt,.md,.json,text/plain,text/markdown,application/json"
                          className="sr-only"
                          onChange={handleJobDescriptionFile}
                          disabled={loading}
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={loading || !jobDescription.trim()}
                        className="bg-[#E11D48] text-white py-3 px-4 rounded-2xl hover:bg-[#BE123C] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Find Matches
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {activeTab === 'chat' && (
                <form onSubmit={handleSearch} className="p-5 border-t border-white/10">
                  <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <Search className="w-5 h-5 text-gray-400 ml-4" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask from indexed resumes..."
                      className="w-full pl-3 pr-14 py-4 bg-transparent focus:outline-none text-white placeholder-gray-500 font-medium"
                      disabled={loading}
                    />
                    <button type="submit" disabled={loading || !query.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#E11D48] text-white p-2.5 rounded-xl hover:bg-[#BE123C] disabled:opacity-50">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-16 h-16 bg-[#E11D48] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(225,29,72,0.4)] hover:bg-[#BE123C] hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-red-500/30"
        >
          {isChatOpen ? <X className="w-8 h-8" /> : <Bot className="w-8 h-8" />}
        </button>
      </div>
    </div>
  );
};

export default AIRecruiter;
