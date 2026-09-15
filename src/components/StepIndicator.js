// The row of numbered dots above the form. Discrete dots rather than a percentage
// bar, and hidden from screen readers because the step heading already says
// "Step 2 of 4" in words.

import React from 'react';

const StepIndicator = ({ steps, currentIndex }) => (
  <ol className="step-indicator" aria-hidden="true">
    {steps.map((step, index) => {
      const state = index < currentIndex ? 'completed' : index === currentIndex ? 'active' : '';
      return (
        <React.Fragment key={step.id}>
          {index > 0 && <li className={`step-line${index <= currentIndex ? ' completed' : ''}`} />}
          <li className="step">
            {/* Tick, so "done" is not signalled by colour alone. */}
            <span className={`step-number ${state}`}>{index < currentIndex ? '✓' : index + 1}</span>
            <span className="step-title">{step.title}</span>
          </li>
        </React.Fragment>
      );
    })}
  </ol>
);

export default StepIndicator;
