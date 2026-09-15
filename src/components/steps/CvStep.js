import React from 'react';
import CvUpload from '../CvUpload';

// First step on purpose. Reading the CV is only useful if it happens before the
// applicant types the things it can fill in.
const CvStep = ({ userId }) => (
  <>
    <p className="step-intro">
      Start with your CV. We will read it and offer to fill in what we can, so you have
      less to type. Nothing is filled in until you say so.
    </p>
    <CvUpload userId={userId} />
  </>
);

export default CvStep;
