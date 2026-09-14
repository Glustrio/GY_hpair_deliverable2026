import React from 'react';
import { useField, useFormikContext } from 'formik';
import { FIELDS } from '../validation/applicationSchema';

// Three text boxes rather than <input type="date">. A date picker is a tool for
// finding a date you do not know, and everyone knows their own birthday. The native
// control also orders its fields by the operating system's locale, so a US and a UK
// laptop show different field orders on the same page and the page cannot override it.
const DateOfBirthField = () => {
  const { values, handleChange } = useFormikContext();
  // The whole-date check reports against dobDay, so the group shows one message and
  // focus lands on the first box.
  const [, meta] = useField(FIELDS.dobDay);
  const showError = meta.touched && Boolean(meta.error);

  const errorId = 'dob-error';
  const hintId = 'dob-hint';
  const describedBy = [hintId, showError && errorId].filter(Boolean).join(' ');

  const box = (name, label, width) => (
    <div className="dob-part">
      <label className="form-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={values[name]}
        onChange={handleChange}
        // type="number" cannot be dictated in Dragon, exposes unlabelled spin
        // buttons, and silently changes value on a scroll wheel.
        type="text"
        inputMode="numeric"
        className={showError ? 'form-input has-error' : 'form-input'}
        style={{ width }}
        aria-describedby={describedBy}
        aria-invalid={showError}
        aria-required
        autoComplete={`bday-${name.replace('dob', '').toLowerCase()}`}
      />
    </div>
  );

  return (
    <fieldset className="form-group dob-fieldset">
      <legend className="form-label">Date of birth</legend>

      <p className="form-hint" id={hintId}>
        For example, 27 3 2007. You can type the month as a name.
      </p>

      <div className="dob-inputs">
        {box(FIELDS.dobDay, 'Day', '4rem')}
        {box(FIELDS.dobMonth, 'Month', '7rem')}
        {box(FIELDS.dobYear, 'Year', '6rem')}
      </div>

      {showError && (
        <p className="form-error" id={errorId}>
          {meta.error}
        </p>
      )}
    </fieldset>
  );
};

export default DateOfBirthField;
