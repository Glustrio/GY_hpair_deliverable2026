import React, { useEffect, useRef, useState } from 'react';
import { useFormikContext } from 'formik';
import { saveDraft } from '../services/draftService';

const DEBOUNCE_MS = 1000;

// Saving on every keystroke writes constantly mid-typing, so wait for a pause. The
// cleanup clears the pending timer, which means only the last change in a burst is
// written, and that changing step or pausing also cancels an in-flight save.
const AutoSaveDraft = ({ userId, stepIndex, paused }) => {
  const { values } = useFormikContext();
  const [savedAt, setSavedAt] = useState(null);

  // Compared by value rather than tracked with a "has run once" flag. StrictMode
  // remounts the component but keeps refs, so a boolean flag is already flipped on
  // the second run and an empty draft gets written over a real one.
  const initial = useRef({ values, stepIndex });

  useEffect(() => {
    if (paused) return undefined;
    // Formik keeps values referentially stable until something actually changes.
    if (values === initial.current.values && stepIndex === initial.current.stepIndex) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      const result = await saveDraft(userId, values, stepIndex);
      if (result.success) setSavedAt(new Date());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [values, stepIndex, userId, paused]);

  // A plain span, not a live region. Announcing "saved" every few seconds would be
  // noise over whatever the user is actually doing.
  return (
    <p className="draft-status">
      {savedAt
        ? `Draft saved at ${savedAt.toLocaleTimeString()}`
        : 'Your progress saves automatically.'}
    </p>
  );
};

export default AutoSaveDraft;
