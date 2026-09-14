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

    {/* Labelled citizenship rather than nationality because the list holds country
        names, so "Nationality: Japan" would be a question and answer that disagree.
        No autocomplete attribute: the spec defines country as part of an address, so
        a browser would fill in where the applicant lives, not where they are a citizen. */}
    <FormField name={FIELDS.citizenship} label="Country of citizenship" as="select">
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
