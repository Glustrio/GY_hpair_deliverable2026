import React from 'react';
import FormField from '../FormField';
import { FIELDS } from '../../validation/applicationSchema';
import { LANGUAGES } from '../../constants/languages';

const ContactStep = () => (
  <>
    {/* One box rather than separate street, city and postcode fields. Split fields
        only work when you know which countries the addresses come from, and HPAIR's
        applicants are international. street-address is also a multiline token in the
        HTML spec, so it is only valid on a textarea. */}
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
  </>
);

export default ContactStep;
