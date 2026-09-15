// Step one. The CV, on its own, so reading it happens before anything it can fill in.

import React from 'react';
import CvUpload from '../CvUpload';

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
