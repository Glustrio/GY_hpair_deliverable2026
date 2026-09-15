// Turns the form's values into the document that gets stored, and drives the review
// screen. Every type conversion happens here and nowhere else, which is why no
// validation rule has to straddle one.

import { COUNTRIES } from '../constants/countries';
import { LANGUAGES } from '../constants/languages';
import { FIELDS, buildDate, normaliseLinkedinUrl } from '../validation/applicationSchema';

const nameFor = (list, code) => list.find((item) => item.code === code)?.name ?? code;

export const countryName = (code) => nameFor(COUNTRIES, code);
export const languageName = (code) => nameFor(LANGUAGES, code);

const GENDER_LABELS = {
  woman: 'Woman',
  man: 'Man',
  'non-binary': 'Non-binary',
  'prefer-not-to-say': 'Prefer not to say',
};

// A calendar date, stored as a plain YYYY-MM-DD string. A Timestamp would anchor a
// birthday to a moment in one time zone and can render as the day before somewhere else.
const formatDateOfBirth = (values) => {
  const date = buildDate(values[FIELDS.dobDay], values[FIELDS.dobMonth], values[FIELDS.dobYear]);
  if (!date) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// The one place that decides the shape of a stored submission, and the one place
// that does the type conversions, which is why no Yup condition has to straddle one.
// The same key list is repeated in firestore.rules and must be changed in both.
export const toSubmission = (values, user) => ({
  userId: user.uid,
  userEmail: user.email,

  firstName: values[FIELDS.firstName].trim(),
  lastName: values[FIELDS.lastName].trim(),
  dateOfBirth: formatDateOfBirth(values),
  citizenship: values[FIELDS.citizenship],

  address: values[FIELDS.address].trim(),
  phone: values[FIELDS.phone].trim(),
  preferredLanguage: values[FIELDS.preferredLanguage],
  // Empty string rather than omitted, so the document shape is always the same.
  preferredLanguageOther:
    values[FIELDS.preferredLanguage] === 'other' ? values[FIELDS.preferredLanguageOther].trim() : '',

  cv: values[FIELDS.cv],

  // The radio holds 'yes' or 'no' all the way through the form and becomes a boolean
  // exactly here. Converting earlier would break the condition that reveals the URL.
  hasLinkedin: values[FIELDS.hasLinkedin] === 'yes',
  linkedinUrl:
    values[FIELDS.hasLinkedin] === 'yes' ? normaliseLinkedinUrl(values[FIELDS.linkedinUrl]) : null,

  // Optional, so an unanswered question is stored as an empty string rather than
  // being left out. A consistent shape means nothing has to check for missing keys.
  gender: values[FIELDS.gender] || '',
});

// Drives the review screen and the downloaded summary from one list, so the file
// can never disagree with what the applicant saw before submitting.
export const SUMMARY_SECTIONS = [
  {
    title: 'Your CV',
    step: 0,
    rows: [{ label: 'CV', value: (v) => v[FIELDS.cv]?.fileName }],
  },
  {
    title: 'About you',
    step: 1,
    rows: [
      { label: 'First name', value: (v) => v[FIELDS.firstName] },
      { label: 'Last name', value: (v) => v[FIELDS.lastName] },
      { label: 'Date of birth', value: (v) => formatDateOfBirth(v) },
      { label: 'Nationality', value: (v) => countryName(v[FIELDS.citizenship]) },
    ],
  },
  {
    title: 'Contact and profile',
    step: 2,
    rows: [
      { label: 'Home address', value: (v) => v[FIELDS.address] },
      { label: 'Phone number', value: (v) => v[FIELDS.phone] },
      {
        label: 'Preferred language',
        value: (v) =>
          v[FIELDS.preferredLanguage] === 'other'
            ? v[FIELDS.preferredLanguageOther]
            : languageName(v[FIELDS.preferredLanguage]),
      },
      { label: 'Has a LinkedIn profile', value: (v) => (v[FIELDS.hasLinkedin] === 'yes' ? 'Yes' : 'No') },
      {
        label: 'LinkedIn profile',
        value: (v) => normaliseLinkedinUrl(v[FIELDS.linkedinUrl]),
        // Without this, everyone who answered no sees an empty LinkedIn row.
        visible: (v) => v[FIELDS.hasLinkedin] === 'yes',
      },
    ],
  },
];

// Conditional answers are filtered out here, so the review screen and the PDF never
// show an empty LinkedIn row to someone who answered no.
export const visibleRows = (section, values) =>
  section.rows.filter((row) => !row.visible || row.visible(values));

export const displayValue = (value) => (value === undefined || value === null || value === '' ? 'Not provided' : String(value));

export const genderLabel = (code) => (code ? GENDER_LABELS[code] ?? code : 'Not answered');
