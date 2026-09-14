// Languages offered for the preferred-contact-language question.
// A short curated list rather than all ~7,000 living languages, with 'other' as the
// escape hatch so nobody is excluded. Names come from Unicode CLDR via Intl.DisplayNames.

export const LANGUAGES = [
  { code: 'ar', name: 'Arabic' },
  { code: 'bn', name: 'Bangla' },
  { code: 'zh', name: 'Chinese' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'other', name: 'Another language' },
];

// Used by the Yup oneOf() rule so a hand-typed value cannot reach the database.
export const LANGUAGE_CODES = LANGUAGES.map((language) => language.code);

