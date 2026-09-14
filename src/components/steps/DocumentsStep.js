import React from 'react';
import { useFormikContext, useField } from 'formik';
import FormField from '../FormField';
import CvUpload from '../CvUpload';
import { FIELDS } from '../../validation/applicationSchema';

const DocumentsStep = ({ userId }) => {
  const { values, handleChange } = useFormikContext();
  const [, meta] = useField(FIELDS.hasLinkedin);
  const showError = meta.touched && Boolean(meta.error);

  return (
    <>
      <CvUpload userId={userId} />

      {/* A fieldset because "Yes" on its own means nothing. Without the legend a
          screen reader announces only "Yes, radio button, 1 of 2". */}
      <fieldset className="form-group radio-fieldset">
        <legend className="form-label">Do you have a LinkedIn profile?</legend>

        {[
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ].map((option) => (
          <div className="radio-option" key={option.value}>
            <input
              type="radio"
              id={`${FIELDS.hasLinkedin}-${option.value}`}
              name={FIELDS.hasLinkedin}
              value={option.value}
              checked={values[FIELDS.hasLinkedin] === option.value}
              onChange={handleChange}
              aria-describedby={showError ? 'hasLinkedin-error' : undefined}
            />
            <label htmlFor={`${FIELDS.hasLinkedin}-${option.value}`}>{option.label}</label>
          </div>
        ))}

        {showError && (
          <p className="form-error" id="hasLinkedin-error">
            {meta.error}
          </p>
        )}
      </fieldset>

      {values[FIELDS.hasLinkedin] === 'yes' && (
        <FormField
          name={FIELDS.linkedinUrl}
          label="LinkedIn profile URL"
          // type="text" rather than type="url", because type="url" makes the browser
          // reject linkedin.com/in/name typed without https:// before Yup ever sees it.
          type="text"
          inputMode="url"
          autoComplete="url"
          hint="For example, linkedin.com/in/your-name"
        />
      )}
    </>
  );
};

export default DocumentsStep;
