// The row of numbered dots above the form, with a bar showing how far through you are.
// Hidden from screen readers because the step heading already says "Step 2 of 4" in
// words, and a bar that accurately shows 2 of 4 cannot misstate progress the way a
// percentage of unknown work can.
import React from 'react';

const StepIndicator = ({ steps, currentIndex }) => (
  <div className="step-progress" aria-hidden="true">
    <ol className="step-indicator">
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

    <div className="step-bar">
      <div
        className="step-bar-fill"
        style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
      />
    </div>
  </div>
);

export default StepIndicator;
