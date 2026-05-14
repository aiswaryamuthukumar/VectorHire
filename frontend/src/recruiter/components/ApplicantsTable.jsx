import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Eye, Search, Filter, ChevronLeft, ChevronRight, XCircle, Calendar, Clock, Loader2 } from 'lucide-react';
import { getApplicants, runCandidateAction, getResumeUrl } from '../../services/api';

const ApplicantsTable = ({ title, statusFilter = null }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');
  const [localStatusFilter, setLocalStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);
  
  const itemsPerPage = 8;

  useEffect(() => {
    fetchApplicants();
  }, [statusFilter]);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const response = await getApplicants();
      let data = response.applicants || response;
      if (!Array.isArray(data)) data = [];
      
      if (statusFilter) {
        data = data.filter(a => (a.status || '').toLowerCase() === statusFilter.toLowerCase());
      }
      setApplicants(data);
    } catch (error) {
      console.error('Failed to fetch applicants:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2600);
  };

  const handleStatusUpdate = async (candidateId, newStatus) => {
    if (candidateId === undefined || candidateId === null) {
      showToast('Candidate id is missing.', 'error');
      return;
    }

    try {
      setUpdatingId(candidateId);
      const result = await runCandidateAction(candidateId, newStatus);
      const updated = result.updated_data;
      setApplicants(prev => {
        if (statusFilter && newStatus !== statusFilter) {
          return prev.filter(a => a.id !== candidateId);
        }
        return prev.map(a => a.id === candidateId ? { ...a, ...updated, status: newStatus } : a);
      });
      await fetchApplicants();

      if (result.email?.error) {
        showToast(`Candidate moved to ${newStatus}. Email failed to send.`, 'error');
      } else if (result.email?.sent) {
        showToast(`Candidate moved to ${newStatus}. Email sent.`);
      } else {
        showToast(`Candidate moved to ${newStatus}.`);
      }
    } catch (error) {
      console.error('Failed to update status', error);
      showToast(error?.response?.data?.detail || error?.message || 'Failed to update candidate status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApplicants = applicants
    .filter(a => 
      (a.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (a.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(a => {
      if (localStatusFilter === 'all') return true;
      return (a.status || 'pending').toLowerCase() === localStatusFilter.toLowerCase();
    })
    .sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      if (sortOrder === 'asc') return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });

  const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);
  const currentApplicants = filteredApplicants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      {toast && (
        <div className={`fixed top-6 right-6 z-[80] px-4 py-3 rounded-xl shadow-lg border text-sm font-bold ${
          toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            <span>{title.split(' ')[0]}<span className="text-[#E11D48]">{title.split(' ').slice(1).join('')}</span></span>
          </h1>
          <p className="text-[#BE123C]">Manage, review, and organize your candidates.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or role..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all shadow-sm"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="p-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#E11D48] hover:bg-red-50 transition-colors shadow-sm"
            >
              <Filter className="w-5 h-5" />
            </button>
            
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Sort By Name</span>
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => { setSortOrder('asc'); setShowFilterMenu(false); }}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortOrder === 'asc' ? 'bg-red-50 text-[#E11D48] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Ascending (A-Z)
                    </button>
                    <button 
                      onClick={() => { setSortOrder('desc'); setShowFilterMenu(false); }}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortOrder === 'desc' ? 'bg-red-50 text-[#E11D48] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Descending (Z-A)
                    </button>
                  </div>
                </div>
                
                <div className="p-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Filter Status</span>
                  <div className="flex flex-col gap-1">
                    {['all', 'pending', 'shortlisted', 'interview', 'rejected'].map(status => (
                      <button 
                        key={status}
                        onClick={() => { setLocalStatusFilter(status); setShowFilterMenu(false); }}
                        className={`text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize ${localStatusFilter === status ? 'bg-red-50 text-[#E11D48] font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {status === 'pending' ? 'Selecting / Pending' : status === 'shortlisted' ? 'Selected / Shortlisted' : status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-50 border-b border-red-100 text-[#E11D48] text-sm font-semibold uppercase tracking-wider">
                <th className="py-5 px-8">Candidate</th>
                <th className="py-5 px-6">Role</th>
                <th className="py-5 px-6">Status</th>
                <th className="py-5 px-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <div className="inline-block animate-spin w-8 h-8 border-4 border-[#E11D48] border-t-transparent rounded-full mb-4"></div>
                    <p className="text-gray-500">Loading candidates...</p>
                  </td>
                </tr>
              ) : currentApplicants.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-gray-500">
                    <p className="text-lg">No candidates found.</p>
                  </td>
                </tr>
              ) : (
                currentApplicants.map((applicant, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={applicant.id} 
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#E11D48] font-bold text-lg border border-red-100">
                          {(applicant.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-base">{applicant.name}</div>
                          <div className="text-sm text-gray-500">{applicant.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {applicant.role || 'N/A'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold capitalize border ${
                        applicant.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        applicant.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                        applicant.status === 'interview' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          applicant.status === 'shortlisted' ? 'bg-emerald-500' :
                          applicant.status === 'rejected' ? 'bg-red-500' :
                          applicant.status === 'interview' ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`}></span>
                        {applicant.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex items-center justify-end gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => applicant.resume_filename && window.open(getResumeUrl(applicant.resume_filename), '_blank')}
                          disabled={!applicant.resume_filename}
                          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                          title="View Resume"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {updatingId === applicant.id && <Loader2 className="w-5 h-5 animate-spin text-[#E11D48]" />}
                        {applicant.status !== 'shortlisted' && (
                          <button 
                            onClick={() => handleStatusUpdate(applicant.id, 'shortlisted')}
                            disabled={updatingId === applicant.id}
                            className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                            title="Shortlist"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        {applicant.status !== 'rejected' && (
                          <button 
                            onClick={() => handleStatusUpdate(applicant.id, 'rejected')}
                            disabled={updatingId === applicant.id}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                        {applicant.status !== 'interview' && (
                          <button 
                            onClick={() => handleStatusUpdate(applicant.id, 'interview')}
                            disabled={updatingId === applicant.id}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            title="Schedule Interview"
                          >
                            <Calendar className="w-5 h-5" />
                          </button>
                        )}
                        {applicant.status !== 'pending' && (
                          <button 
                            onClick={() => handleStatusUpdate(applicant.id, 'pending')}
                            disabled={updatingId === applicant.id}
                            className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100"
                            title="Move to Pending"
                          >
                            <Clock className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500 ml-4">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredApplicants.length)} of {filteredApplicants.length}
            </span>
            <div className="flex items-center gap-2 mr-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-100 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-4 py-2 text-sm font-medium text-gray-900">
                Page {currentPage} of {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-100 transition-colors shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default ApplicantsTable;
