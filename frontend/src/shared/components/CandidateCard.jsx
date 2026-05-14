import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, UserCheck, XCircle, Eye, BookOpen, Brain, Mail } from 'lucide-react';
import { runCandidateAction, getResumeUrl } from '../../services/api';

const CandidateCard = ({ candidate, onStatusChange, onEmailClick }) => {
  const score = candidate.match_score || candidate.similarity_score || 0;
  
  // Vibrant gradients based on score
  const scoreStyle = score > 80 
    ? { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-500/30', glow: 'shadow-[0_0_20px_rgba(74,222,128,0.2)]' } 
    : score > 60 
    ? { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-500/30', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.2)]' }
    : { text: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-500/30', glow: '' };

  const handleStatusUpdate = async (newStatus) => {
    try {
      if (candidate.id === undefined || candidate.id === null) return alert('No candidate id found.');
      await runCandidateAction(candidate.id, newStatus);
      if (onStatusChange) onStatusChange(candidate, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className={`bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${scoreStyle.glow}`}
    >
      <div className="p-6 flex-grow relative">
        <div className="flex justify-between items-start mb-5 relative z-10">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{candidate.name || 'Candidate'}</h3>
            <p className="text-sm text-blue-400 font-medium">{candidate.role || 'Applicant'}</p>
          </div>
          {score > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm ${scoreStyle.bg} ${scoreStyle.text} ${scoreStyle.border} border`}>
              <Award className="w-4 h-4" />
              {Math.round(score)}% Match
            </div>
          )}
        </div>

        {candidate.summary && (
          <div className="mb-5 bg-white/5 rounded-xl p-4 border border-white/5 relative z-10">
            <span className="font-semibold text-slate-200 mb-2 flex items-center gap-2 text-sm">
              <Brain className="w-4 h-4 text-blue-400" /> AI Analysis
            </span>
            <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{candidate.summary}</p>
          </div>
        )}

        {candidate.skills && candidate.skills.length > 0 && (
          <div className="mb-4 relative z-10">
            <div className="flex flex-wrap gap-2">
              {candidate.skills.slice(0, 5).map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs rounded-lg font-medium">
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 5 && (
                <span className="px-2.5 py-1 bg-white/5 text-slate-400 text-xs rounded-lg font-medium">
                  +{candidate.skills.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-black/20 p-4 border-t border-white/5 flex gap-2">
        <button 
          onClick={() => window.open(getResumeUrl(candidate.filename || candidate.resume_filename), '_blank')}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors border border-white/5"
        >
          <Eye className="w-4 h-4 text-slate-400" /> Resume
        </button>
        
        {onEmailClick && (
          <button 
            onClick={() => onEmailClick(candidate)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl text-sm font-medium transition-colors border border-blue-500/30"
            title="Send Email"
          >
            <Mail className="w-4 h-4" />
          </button>
        )}

        {candidate.status !== 'shortlisted' && (
          <button 
            onClick={() => handleStatusUpdate('shortlisted')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl text-sm font-medium transition-colors border border-green-500/30"
            title="Shortlist"
          >
            <UserCheck className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default CandidateCard;
