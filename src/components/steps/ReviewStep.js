// Step four. Every answer, with Edit links back to the step that owns it, plus the
// one optional demographic question.

import React from 'react';
import { useFormikContext } from 'formik';
import FormField from '../FormField';
import { FIELDS } from '../../validation/applicationSchema';
import { SUMMARY_SECTIONS, visibleRows, displayValue } from '../../utils/submission';

const GENDER_OPTIONS = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const ReviewStep = ({ onEditStep }) => {
  const { values } = useFormikContext();

  return (
    <>
      {SUMMARY_SECTIONS.map((section) => (
        <section className="summary-section" key={section.title}>
          <div className="summary-header">
            <h3 className="summary-title">{section.title}</h3>
            {/* type="button" matters: a bare button inside a form defaults to
                type="submit", so every Edit click would submit the application. */}
            <button type="button" className="summary-edit" onClick={() => onEditStep(section.step)}>
              Edit<span className="visually-hidden"> {section.title}</span>
            </button>
          </div>

          {visibleRows(section, values).map((row) => (
            <div className="summary-item" key={row.label}>
              <span className="summary-label">{row.label}</span>
              <span className="summary-value">{displayValue(row.value(values))}</span>
            </div>
          ))}
        </section>
      ))}

      {/* Asked after the review rather than inside the form. Nothing downstream uses
          it to process an application, and GOV.UK, Greenhouse and Lever independently
          all place equality questions here so they cannot read as a gate. */}
      <section className="summary-section">
        <h3 className="summary-title">One optional question</h3>
        <p>
          This is optional and will not affect your application. It helps HPAIR understand
          who applies.
        </p>

        <FormField name={FIELDS.gender} label="Gender" as="select" optional>
          <option value="">Prefer not to answer</option>
          {GENDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormField>
      </section>
    </>
  );
};

export default ReviewStep;
