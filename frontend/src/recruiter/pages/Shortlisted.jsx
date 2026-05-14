import React from 'react';
import ApplicantsTable from '../components/ApplicantsTable';

const Shortlisted = () => {
  return <ApplicantsTable title="Shortlisted Candidates" statusFilter="shortlisted" />;
};

export default Shortlisted;
