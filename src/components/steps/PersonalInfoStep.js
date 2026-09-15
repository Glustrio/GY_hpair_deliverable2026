// Step two. Name, date of birth and nationality.

import React from 'react';
import FormField from '../FormField';
import DateOfBirthField from '../DateOfBirthField';
import { FIELDS } from '../../validation/applicationSchema';
import { COUNTRIES } from '../../constants/countries';

const PersonalInfoStep = () => (
  <>
    <FormField name={FIELDS.firstName} label="First name" autoComplete="given-name" />
    <FormField name={FIELDS.lastName} label="Last name" autoComplete="family-name" />

    <DateOfBirthField />

    {/* No autocomplete attribute: the HTML spec defines country as part of an address,
        so a browser would fill in where someone lives, not where they hold citizenship. */}
    <FormField
      name={FIELDS.citizenship}
      label="Nationality"
      as="select"
      hint="The country where you hold citizenship."
    >
      <option value="">Select a country</option>
      {COUNTRIES.map((country) => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}
    </FormField>
  </>
);

export default PersonalInfoStep;
