import React from 'react';
import { useField } from 'formik';

// One component so the label, hint, error and ARIA attributes are wired the same way
// every time. Copy-pasting eight attributes per field is where the inconsistencies
// come from, and a broken aria-describedby is invisible until someone tests with a
// screen reader.
const FormField = ({ label, name, as = 'input', hint, optional, children, ...rest }) => {
  const [field, meta] = useField(name);
  const showError = meta.touched && Boolean(meta.error);

  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  // Only reference ids that are actually in the DOM. Assistive tech drops a
  // reference to a missing element, so a permanently rendered hidden error is a no-op.
  const describedBy = [hint && hintId, showError && errorId].filter(Boolean).join(' ');

  // onBlur is deliberately not passed on. Formik's handleBlur marks the field
  // touched, which is what makes an error appear the moment you leave a field.
  // Errors here appear when you press Continue, then clear live as you fix them.
  const { onBlur, ...inputProps } = field;

  const shared = {
    ...inputProps,
    ...rest,
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
