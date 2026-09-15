import React, { useRef, useState } from 'react';
import { useField, useFormikContext } from 'formik';
import DatePicker from './DatePicker';
import { FIELDS, buildDate } from '../validation/applicationSchema';

// Three boxes rather than <input type="date">: a picker is for finding a date you do
// not know, and the native control orders its fields by OS locale, so a US and a UK
// laptop show different orders on the same page and the page cannot override it.
// The valid window, which also bounds the year select in the picker.
const today = new Date();
const OLDEST = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
const YOUNGEST = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());

const DateOfBirthField = () => {
  const { values, handleChange, setFieldValue } = useFormikContext();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  // The whole-date check reports against dobDay, so the group shows one message and
  // focus lands on the first box.
  const [, meta] = useField(FIELDS.dobDay);
  const showError = meta.touched && Boolean(meta.error);

  // Echoed back because the month box accepts names, so the user can confirm we read
  // "Sept" the way they meant it.
  const parsed = buildDate(values[FIELDS.dobDay], values[FIELDS.dobMonth], values[FIELDS.dobYear]);

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

      <div className="dob-picker">
        <button
          type="button"
          ref={triggerRef}
          className="btn-link"
          aria-expanded={open}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
        >
          {open ? 'Close calendar' : 'Or pick from a calendar'}
        </button>

        {open && (
          <DatePicker
            value={parsed}
            min={OLDEST}
            max={YOUNGEST}
            onPick={(date) => {
              setFieldValue(FIELDS.dobDay, String(date.getDate()));
              setFieldValue(FIELDS.dobMonth, String(date.getMonth() + 1));
              setFieldValue(FIELDS.dobYear, String(date.getFullYear()));
              setOpen(false);
              triggerRef.current?.focus();
            }}
            onClose={() => {
              setOpen(false);
              triggerRef.current?.focus();
            }}
          />
        )}
      </div>

      {parsed && !showError && (
        <p className="dob-echo">
          {parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}

      {showError && (
        <p className="form-error" id={errorId}>
          {meta.error}
        </p>
      )}
    </fieldset>
  );
};

export default DateOfBirthField;
