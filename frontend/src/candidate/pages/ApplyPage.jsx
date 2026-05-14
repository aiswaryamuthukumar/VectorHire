import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, AlertCircle, FileText, X, Loader2, ChevronDown } from 'lucide-react';
import { applyForJob } from '../../services/api';

const ApplyPage = () => {
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({ name: '', email: '', role: '' });
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragIn = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragOut = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setStatus({ type: '', message: '' });
    } else {
      setStatus({ type: 'error', message: 'Only PDF files are allowed.' });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStatus({ type: '', message: '' });
    } else {
      setStatus({ type: 'error', message: 'Only PDF files are allowed.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus({ type: 'error', message: 'Please upload your resume (PDF).' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('role', formData.role);
    submitData.append('resume', file);

    try {
      const response = await applyForJob(submitData);
      setStatus({ type: 'success', message: response.data.message || 'Application submitted successfully!' });
      setFormData({ name: '', email: '', role: '' });
      setFile(null);
    } catch (error) {
      let errorMsg = 'An error occurred during submission.';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMsg = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMsg = error.response.data.detail.map(err => err.msg).join(', ');
        }
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      setStatus({ type: 'error', message: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl w-full mx-auto bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden relative mt-8 mb-16"
    >
      <div className="bg-[#2E1111] p-10 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E11D48]/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <h2 className="text-4xl font-heading font-bold mb-3 relative z-10 text-white">Join the Team</h2>
        <p className="text-gray-300 relative z-10 text-lg">Let our AI match your unique experience to the perfect role.</p>
      </div>

      <div className="p-10">
        <AnimatePresence>
          {status.message && (
            <motion.div 
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: 'auto', mb: 24 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className={`p-4 rounded-xl flex items-start gap-3 border ${
                status.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
              }`}
            >
              {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-500" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />}
              <p className="font-medium">{status.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all shadow-sm bg-gray-50/50"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all shadow-sm bg-gray-50/50"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Role Applying For</label>
            <div className="relative">
              <select
                name="role"
                required
                value={formData.role}
                onChange={handleInputChange}
                className="w-full pl-5 pr-12 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all shadow-sm bg-gray-50/50 appearance-none cursor-pointer relative z-0"
              >
                <option value="" disabled>Select a role...</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
                <option value="Product Manager">Product Manager</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500 z-10">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Resume (PDF)</label>
            <motion.div 
              animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
              className={`relative mt-1 flex justify-center px-6 py-12 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                isDragging 
                  ? 'border-red-400 bg-red-50/50 shadow-[0_0_20px_rgba(225,29,72,0.1)]' 
                  : 'border-gray-300 hover:border-red-300 hover:bg-gray-50/50 bg-gray-50/30'
              }`}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-4 text-center cursor-pointer w-full">
                {!file ? (
                  <>
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <UploadCloud className={`mx-auto h-16 w-16 ${isDragging ? 'text-red-500' : 'text-gray-400'}`} />
                    </motion.div>
                    <div className="flex flex-col text-sm text-gray-600 justify-center gap-1">
                      <span className="font-semibold text-[#E11D48] text-lg">Click to upload</span>
                      <p>or drag and drop your PDF here</p>
                    </div>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-4 bg-red-50 rounded-full shadow-inner border border-red-100">
                      <FileText className="h-10 w-10 text-[#E11D48]" />
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                      <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{file.name}</span>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </motion.div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </div>
            </motion.div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-md text-lg font-bold text-white bg-[#E11D48] hover:bg-[#BE123C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all transform hover:-translate-y-0.5 ${
              loading ? 'opacity-70 cursor-not-allowed transform-none hover:transform-none' : ''
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Processing...
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ApplyPage;
