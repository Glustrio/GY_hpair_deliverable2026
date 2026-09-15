// The wizard. Owns the Formik instance for all four steps, the step index, the submit
// status and the draft banner. One Formik rather than one per step, so the review
// screen and the autosave can both see every answer.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Formik, Form } from 'formik';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../services/authService';
import { submitForm } from '../services/firebaseService';
import { loadDraft, clearDraft } from '../services/draftService';
import { applicationSchema, EMPTY_VALUES, STEPS, FIELDS } from '../validation/applicationSchema';
import { toSubmission } from '../utils/submission';
import StepIndicator from './StepIndicator';
import AutoSaveDraft from './AutoSaveDraft';
import SubmissionSuccess from './SubmissionSuccess';
import MySubmissions from './MySubmissions';
import TicketPreview from './TicketPreview';
import CvStep from './steps/CvStep';
import PersonalInfoStep from './steps/PersonalInfoStep';
import ContactStep from './steps/ContactStep';
import ReviewStep from './steps/ReviewStep';

// Firestore's write promise does not settle while the browser is offline, so without
// a ceiling the button would read "Sending" forever with no explanation.
const SUBMIT_TIMEOUT_MS = 15000;

// Most inputs have an id equal to their field name. These two do not.
const FOCUS_TARGET = { [FIELDS.hasLinkedin]: `${FIELDS.hasLinkedin}-yes` };

const MultiStepForm = () => {
  const { user, userId } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [draft, setDraft] = useState(null);
  const [draftChecked, setDraftChecked] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const headingRef = useRef(null);
  const errorRef = useRef(null);
  const previousStep = useRef(stepIndex);

  const isLastStep = stepIndex === STEPS.length - 1;

  useEffect(() => {
    if (!userId) return;
    loadDraft(userId).then((res) => {
      if (res.draft) setDraft(res.draft);
      setDraftChecked(true);
    });
  }, [userId]);

  // Focus has to move after the commit, because the new step's heading does not exist
  // yet when the click handler runs. Comparing the previous value rather than using a
  // first-render flag survives StrictMode running effects twice in development.
  useEffect(() => {
    if (previousStep.current === stepIndex) return;
    previousStep.current = stepIndex;
    headingRef.current?.focus();
    window.scrollTo(0, 0);
  }, [stepIndex]);

  useEffect(() => {
    if (status === 'error') errorRef.current?.focus();
  }, [status, attempt]);

  const handleLogout = useCallback(() => signOutUser(), []);

  // The step gate, and the fiddliest thing in the app. Validates the whole form but
  // only blocks on the current step's fields, since later steps are legitimately
  // incomplete. Reads the errors from validateForm's return value, because
  // formik.errors is still the previous render's copy at this point.
  const goNext = async (formik) => {
    const errors = await formik.validateForm();
    const { fields } = STEPS[stepIndex];
    const firstInvalid = fields.find((name) => errors[name]);

    if (firstInvalid) {
      // setTouched replaces the whole map rather than merging, so spreading the
      // existing one is what stops earlier steps losing their touched state. The
      // false argument skips a second full validation that would change nothing.
      const stepTouched = Object.fromEntries(fields.map((name) => [name, true]));
      formik.setTouched({ ...formik.touched, ...stepTouched }, false);
      document.getElementById(FOCUS_TARGET[firstInvalid] ?? firstInvalid)?.focus();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  // Maps the values to a document, writes it, then clears the draft. Order matters at
  // every step, and the comments inside say why.
  const handleSubmit = async (values) => {
    // isSubmitting is state you render from, not a lock, so guard re-entry directly.
    if (status === 'submitting') return;

    if (!navigator.onLine) {
      setStatus('error');
      setStatusMessage(
        'You appear to be offline. Keep this tab open, reconnect, and try again.'
      );
      return;
    }

    setAttempt((count) => count + 1);
    setStatus('submitting');
    setStatusMessage('Sending your application.');

    try {
      const write = submitForm(toSubmission(values, user));
      const firstToSettle = await Promise.race([
        write,
        new Promise((resolve) => setTimeout(() => resolve({ slow: true }), SUBMIT_TIMEOUT_MS)),
      ]);

      // Say it is taking a while, but keep waiting on the same write. Abandoning it
      // and inviting a retry is how an applicant ends up with two applications.
      if (firstToSettle.slow) {
        setStatusMessage('Still sending. Keep this tab open.');
      }

      const response = await write;

      if (!response.success) {
        setStatus('error');
        setStatusMessage(response.message);
        return;
      }

      setResult({ reference: response.id.slice(-8).toUpperCase(), values });
      setStatus('success');
      setRefreshKey((key) => key + 1);
      // Issued only after the write is confirmed, and only after the success screen
      // has replaced the form, so a pending autosave cannot rewrite the draft.
      clearDraft(userId);
    } catch (error) {
      console.error('Submit error:', error);
      setStatus('error');
      setStatusMessage('Something went wrong. Your answers are still here, so please try again.');
    }
  };

  // Clearing result unmounts the success screen, which remounts Formik with empty
  // values, so there is nothing to reset by hand.
  const startAnother = () => {
    setResult(null);
    setStatus('idle');
    setStatusMessage('');
    setStepIndex(0);
  };

  if (status === 'success' && result) {
    return (
      <div className="container">
        <div className="form-container">
          <SubmissionSuccess
            reference={result.reference}
            values={result.values}
            defaultEmail={user.email}
            onStartAnother={startAnother}
          />
        </div>
        <div className="form-container">
          <MySubmissions userId={userId} refreshKey={refreshKey} />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form-container">
        <div className="form-header">
          <h2>HPAIR application</h2>
          <button type="button" onClick={handleLogout} className="btn btn-secondary btn-small">
            Log out
          </button>
        </div>

        <p className="signed-in-as">Signed in as {user.email}</p>
        <p>All questions are required unless they are marked optional.</p>

        <StepIndicator steps={STEPS} currentIndex={stepIndex} />

        <Formik
          initialValues={EMPTY_VALUES}
          validationSchema={applicationSchema}
          onSubmit={handleSubmit}
        >
          {(formik) => (
            <Form
              noValidate
              onKeyDown={(event) => {
                // Enter inside a text field submits the form by default, which on step
                // one would send a nearly empty application. Route it to Continue
                // instead, which is what people expect in a wizard anyway.
                if (
                  event.key === 'Enter' &&
                  event.target.tagName !== 'TEXTAREA' &&
                  event.target.tagName !== 'BUTTON' &&
                  !isLastStep
                ) {
                  event.preventDefault();
                  goNext(formik);
                }
              }}
            >
              {draft && (
                <div className="submit-message info draft-banner">
                  <p>
                    You have a saved draft from{' '}
                    {draft.savedAt?.seconds
                      ? new Date(draft.savedAt.seconds * 1000).toLocaleString()
                      : 'earlier'}
                    .
                  </p>
                  <div className="draft-banner-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => {
                        // Spread over the empty values so every field stays controlled
                        // even if the draft predates one being added.
                        formik.setValues({ ...EMPTY_VALUES, ...draft.values });
                        setStepIndex(Math.min(Math.max(draft.stepIndex ?? 0, 0), STEPS.length - 1));
                        setDraft(null);
                      }}
                    >
                      Restore it
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        clearDraft(userId);
                        setDraft(null);
                      }}
                    >
                      Start fresh
                    </button>
                  </div>
                </div>
              )}

              <h3 ref={headingRef} tabIndex={-1} className="step-heading">
                Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex].title}
              </h3>

              {stepIndex === 0 && <CvStep userId={userId} />}
              {stepIndex === 1 && <PersonalInfoStep />}
              {stepIndex === 2 && <ContactStep />}
              {stepIndex === 3 && <ReviewStep onEditStep={setStepIndex} />}

              {/* Mounted unconditionally. A live region added to the DOM at the same
                  moment as its text is not announced by several screen readers. */}
              <div role="status" aria-live="polite">
                {status === 'submitting' && (
                  <div className="submit-message loading">{statusMessage}</div>
                )}
              </div>

              {status === 'error' && (
                <div
                  key={attempt}
                  ref={errorRef}
                  tabIndex={-1}
                  className="submit-message error"
                  role="alert"
                >
                  {statusMessage}
                </div>
              )}

              <div className="form-actions">
                {stepIndex > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-back"
                    onClick={() => setStepIndex((current) => current - 1)}
                  >
                    Back
                  </button>
                )}

                {isLastStep ? (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    // aria-disabled rather than disabled, because disabling the button
                    // you just pressed drops keyboard focus to the top of the page.
                    aria-disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? 'Sending' : 'Send application'}
                  </button>
                ) : (
                  // Never disabled. A greyed-out button explains nothing and leaves the
                  // tab order. Pressing it validates and moves focus to the first problem.
                  <button type="button" className="btn btn-primary" onClick={() => goNext(formik)}>
                    Continue
                  </button>
                )}
              </div>

              <AutoSaveDraft
                userId={userId}
                stepIndex={stepIndex}
                paused={!draftChecked || draft !== null}
              />

              {/* Fills in as they type, so there is something to watch build up. */}
              <div className="ticket-panel">
                <p className="ticket-panel-label">Your application so far</p>
                <TicketPreview />
              </div>
            </Form>
          )}
        </Formik>
      </div>

      <div className="form-container">
        <MySubmissions userId={userId} refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default MultiStepForm;
