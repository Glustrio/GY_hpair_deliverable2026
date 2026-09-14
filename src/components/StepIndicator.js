import React from 'react';

// Discrete dots rather than a percentage bar. The evidence on progress bars is at
// best mixed, and a bar that appears to move slowly early on measurably increases
// the number of people who give up. A count of four steps cannot create that
// impression, because it is not pretending to measure how much work is left.
//
// The whole thing is hidden from assistive tech because the step heading already
// says "Step 2 of 4: Contact details" in words.
const StepIndicator = ({ steps, currentIndex }) => (
  <ol className="step-indicator" aria-hidden="true">
    {steps.map((step, index) => {
      const state = index < currentIndex ? 'completed' : index === currentIndex ? 'active' : '';
      return (
        <React.Fragment key={step.id}>
          {index > 0 && <li className={`step-line${index <= currentIndex ? ' completed' : ''}`} />}
          <li className="step">
            {/* The tick is what separates "done" from "not reached yet" without
                relying on the green-versus-grey difference alone. */}
            <span className={`step-number ${state}`}>{index < currentIndex ? '✓' : index + 1}</span>
            <span className="step-title">{step.title}</span>
          </li>
        </React.Fragment>
      );
    })}
  </ol>
);

export default StepIndicator;
