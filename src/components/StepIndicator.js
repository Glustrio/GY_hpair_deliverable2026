import React from 'react';

// Discrete dots, not a percentage bar: a bar that looks slow early drives people away.
// aria-hidden because the step heading already says "Step 2 of 4" in words.
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
