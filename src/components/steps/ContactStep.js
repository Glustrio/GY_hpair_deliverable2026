// Step three. Address, phone, language and the LinkedIn question.

import React from 'react';
import { useField, useFormikContext } from 'formik';
import FormField from '../FormField';
import { FIELDS } from '../../validation/applicationSchema';
import { LANGUAGES } from '../../constants/languages';

const ContactStep = () => {
  const { values, handleChange } = useFormikContext();
  const [, linkedinMeta] = useField(FIELDS.hasLinkedin);
  const showLinkedinError = linkedinMeta.touched && Boolean(linkedinMeta.error);

  return (
    <>
      {/* One box, not separate street and city fields: split fields assume you know
          which countries the addresses come from, and street-address is a multiline
          token in the HTML spec so it is only valid on a textarea. */}
      <FormField
        name={FIELDS.address}
        label="Home address"
        as="textarea"
        autoComplete="street-address"
        hint="Include the street, city, postal code and country."
      />

      <FormField
        name={FIELDS.phone}
        label="Phone number"
        type="tel"
        autoComplete="tel"
        hint="Include your country code, for example +1 617 495 1000. Do not include an extension."
      />

      <FormField name={FIELDS.preferredLanguage} label="Preferred language" as="select">
        <option value="">Select a language</option>
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </FormField>

      {values[FIELDS.preferredLanguage] === 'other' && (
        <FormField
          name={FIELDS.preferredLanguageOther}
          label="Which language?"
          hint="Anything outside the list above."
        />
      )}

      {/* A fieldset because "Yes" alone means nothing. Without the legend a screen
          reader announces only "Yes, radio button, 1 of 2". */}
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
              aria-describedby={showLinkedinError ? 'hasLinkedin-error' : undefined}
            />
            <label htmlFor={`${FIELDS.hasLinkedin}-${option.value}`}>{option.label}</label>
          </div>
        ))}

        {showLinkedinError && (
          <p className="form-error" id="hasLinkedin-error">
            {linkedinMeta.error}
          </p>
        )}
      </fieldset>

      {values[FIELDS.hasLinkedin] === 'yes' && (
        <FormField
          name={FIELDS.linkedinUrl}
          label="LinkedIn profile URL"
          // type="text" not type="url", or the browser rejects linkedin.com/in/name
          // typed without https:// before Yup ever sees it.
          type="text"
          inputMode="url"
          autoComplete="url"
          hint="For example, linkedin.com/in/your-name"
        />
      )}
    </>
  );
};

export default ContactStep;
