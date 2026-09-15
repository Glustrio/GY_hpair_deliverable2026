// One labelled input, with its hint, its error and the ARIA attributes that tie them
// together. Exists so that wiring cannot drift between fields.

import React from 'react';
import { useField } from 'formik';

const FormField = ({ label, name, as = 'input', hint, optional, children, ...rest }) => {
  const [field, meta, helpers] = useField(name);
  const showError = meta.touched && Boolean(meta.error);

  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  // Only reference ids that exist: assistive tech drops a reference to a missing node.
  const describedBy = [hint && hintId, showError && errorId].filter(Boolean).join(' ');

  // Formik's own handleBlur marks every field touched, which shouts at someone who
  // tabbed past an empty box. This only reports a field they actually typed in.
  const { onBlur, ...inputProps } = field;
  const handleBlur = () => {
    if (field.value) helpers.setTouched(true);
  };

  const shared = {
    ...inputProps,
    ...rest,
    onBlur: handleBlur,
    id: name,
    className: showError ? 'form-input has-error' : 'form-input',
    'aria-required': optional ? undefined : true,
    'aria-invalid': showError,
    'aria-describedby': describedBy || undefined,
  };

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>
        {label}
        {optional && <span className="form-optional"> (optional)</span>}
      </label>

      {hint && (
        <p className="form-hint" id={hintId}>
          {hint}
        </p>
      )}

      {as === 'select' && <select {...shared}>{children}</select>}
      {as === 'textarea' && <textarea {...shared} rows={4} />}
      {as === 'input' && <input {...shared} />}

      {showError && (
        <p className="form-error" id={errorId}>
          {meta.error}
        </p>
      )}
    </div>
  );
};

export default FormField;
