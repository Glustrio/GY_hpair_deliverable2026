// Saves the in progress application a second after typing stops.

import React, { useEffect, useRef, useState } from 'react';
import { useFormikContext } from 'formik';
import { saveDraft } from '../services/draftService';

const DEBOUNCE_MS = 1000;

const AutoSaveDraft = ({ userId, stepIndex, paused }) => {
  const { values } = useFormikContext();
  const [savedAt, setSavedAt] = useState(null);

  // Compared by value, not a "has run" flag: StrictMode keeps refs across its remount,
  // so a flag is already flipped on the second run and an empty draft overwrites a real one.
  const initial = useRef({ values, stepIndex });

  useEffect(() => {
    if (paused) return undefined;
    if (values === initial.current.values && stepIndex === initial.current.stepIndex) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      const result = await saveDraft(userId, values, stepIndex);
      if (result.success) setSavedAt(new Date());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [values, stepIndex, userId, paused]);

  // Not a live region: announcing "saved" every few seconds is noise.
  return (
    <p className="draft-status">
      {savedAt
        ? `Draft saved at ${savedAt.toLocaleTimeString()}`
        : 'Your progress saves automatically.'}
    </p>
  );
};

export default AutoSaveDraft;
