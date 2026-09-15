import React, { useEffect, useRef, useState } from 'react';
import { SUMMARY_SECTIONS, visibleRows, displayValue } from '../utils/submission';
import { downloadSummaryPdf } from '../utils/summaryPdf';
import { emailSummary } from '../services/emailService';

const SubmissionSuccess = ({ reference, values, onStartAnother, defaultEmail }) => {
  const headingRef = useRef(null);
  const [email, setEmail] = useState(defaultEmail || '');
  const [sending, setSending] = useState(false);
  const [emailResult, setEmailResult] = useState(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const [saving, setSaving] = useState(false);

  const handleEmail = async (event) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setEmailResult(await emailSummary(email, values, reference));
    setSending(false);
  };

  const handleDownload = async () => {
    setSaving(true);
    await downloadSummaryPdf(values, reference);
    setSaving(false);
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

      <form className="email-copy" onSubmit={handleEmail}>
        <label className="form-label" htmlFor="email-copy-to">
          Email yourself a copy
        </label>
        <div className="email-copy-row">
          <input
            id="email-copy-to"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-secondary" aria-disabled={sending}>
            {sending ? 'Sending' : 'Send'}
          </button>
        </div>
        <div role="status" aria-live="polite">
          {emailResult && (
            <div className={`submit-message ${emailResult.success ? 'success' : 'error'}`}>
              {emailResult.message}
            </div>
          )}
        </div>
      </form>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary btn-back" onClick={onStartAnother}>
          Start another application
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleDownload}
          aria-disabled={saving}
        >
          {saving ? 'Preparing PDF' : 'Download a copy (PDF)'}
        </button>
      </div>
    </div>
  );
};

export default SubmissionSuccess;
