import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Landing
import Landing from './app/Landing';

// Candidate
import CandidateLayout from './candidate/layouts/CandidateLayout';
import ApplyPage from './candidate/pages/ApplyPage';

// Recruiter
import RecruiterLayout from './recruiter/layouts/RecruiterLayout';
import RecruiterLogin from './recruiter/pages/RecruiterLogin';
import RecruiterDashboard from './recruiter/pages/RecruiterDashboard';
import AIRecruiter from './recruiter/pages/AIRecruiter';
import Applicants from './recruiter/pages/Applicants';
import Shortlisted from './recruiter/pages/Shortlisted';

// Basic Auth Guard
const RecruiterRoute = ({ children }) => {
  const isAuth = localStorage.getItem('recruiter_auth');
  if (!isAuth) {
    return <Navigate to="/recruiter/login" />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Candidate Portal */}
        <Route path="/candidate" element={<CandidateLayout />}>
          <Route index element={<Navigate to="/candidate/apply" />} />
          <Route path="apply" element={<ApplyPage />} />
        </Route>
        
        {/* Recruiter Portal */}
        <Route path="/recruiter/login" element={<RecruiterLogin />} />
        
        <Route path="/recruiter" element={<RecruiterRoute><RecruiterLayout /></RecruiterRoute>}>
          <Route index element={<Navigate to="/recruiter/dashboard" />} />
          <Route path="dashboard" element={<RecruiterDashboard />} />
          <Route path="ai" element={<AIRecruiter />} />
          <Route path="applicants" element={<Applicants />} />
          <Route path="shortlisted" element={<Shortlisted />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
