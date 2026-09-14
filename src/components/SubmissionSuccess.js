import React, { useEffect, useRef } from 'react';
import { buildSummaryText, downloadTextFile, SUMMARY_SECTIONS, visibleRows, displayValue }
  from '../utils/submission';

const SubmissionSuccess = ({ reference, values, onStartAnother }) => {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handleDownload = () => {
    const safeName = (values.lastName || 'application').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(`hpair-${safeName}-${date}.txt`, buildSummaryText(values, reference));
  };

  return (
    <div className="confirmation">
      <h2 ref={headingRef} tabIndex={-1} className="confirmation-title">
        Application sent
      </h2>

      <p>
        Your reference number is <strong>{reference}</strong>. Keep it for your records.
      </p>

      {/* The summary is on screen as well as downloadable, so the applicant still has
          their answers if the download is blocked. */}
      {SUMMARY_SECTIONS.map((section) => (
        <section className="summary-section" key={section.title}>
          <h3 className="summary-title">{section.title}</h3>
          {visibleRows(section, values).map((row) => (
            <div className="summary-item" key={row.label}>
              <span className="summary-label">{row.label}</span>
              <span className="summary-value">{displayValue(row.value(values))}</span>
            </div>
          ))}
        </section>
      ))}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary btn-back" onClick={onStartAnother}>
          Start another application
        </button>
        <button type="button" className="btn btn-primary" onClick={handleDownload}>
          Download a copy
        </button>
      </div>
    </div>
  );
};

export default SubmissionSuccess;
