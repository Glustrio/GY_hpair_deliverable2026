import * as Yup from 'yup';
import { COUNTRY_CODES } from '../constants/countries';
import { LANGUAGE_CODES } from '../constants/languages';

// Field names live here and are imported everywhere else. A one-character drift
// between the schema, the step gate and the input id silently breaks focus handling
// and lets the gate advance past a step that still has an error on it.
export const FIELDS = {
  firstName: 'firstName',
  lastName: 'lastName',
  dobDay: 'dobDay',
  dobMonth: 'dobMonth',
  dobYear: 'dobYear',
  citizenship: 'citizenship',
  address: 'address',
  phone: 'phone',
  preferredLanguage: 'preferredLanguage',
  preferredLanguageOther: 'preferredLanguageOther',
  cv: 'cv',
  hasLinkedin: 'hasLinkedin',
  linkedinUrl: 'linkedinUrl',
  gender: 'gender',
};

// Firestore caps a whole document at 1 MiB. The PDF is stored as a bytes field,
// which is not inflated the way base64 would be, so 800 KB leaves room for the rest
// of the document. A text-based CV is usually well under 500 KB.
export const MAX_CV_BYTES = 800 * 1024;
export const CV_CONTENT_TYPE = 'application/pdf';
const MIN_AGE_YEARS = 13;

export const EMPTY_VALUES = {
  firstName: '',
  lastName: '',
  dobDay: '',
  dobMonth: '',
  dobYear: '',
  citizenship: '',
  address: '',
  phone: '',
  preferredLanguage: '',
  preferredLanguageOther: '',
  cv: null,
  hasLinkedin: '',
  linkedinUrl: '',
  gender: '',
};

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

// GOV.UK found hundreds of users typing "March" into a month box and getting an
// error, so accept names and abbreviations as well as numbers.
const parseMonth = (raw) => {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) return null;

  if (/^\d{1,2}$/.test(value)) {
    const n = Number(value);
    return n >= 1 && n <= 12 ? n : null;
  }

  const typed = value.replace(/\.$/, '');
  const index = MONTH_NAMES.findIndex(
    (name) => name === typed || (typed.length >= 3 && name.startsWith(typed))
  );
  return index === -1 ? null : index + 1;
};

// Returns a Date only when the parts describe a day that actually exists, so
// 31 February is rejected rather than rolling over into March.
export const buildDate = (day, month, year) => {
  const rawDay = String(day ?? '').trim();
  const rawYear = String(year ?? '').trim();

  // Digits only. Number() would otherwise accept '1e1', '0x1b', '+5' and '5.0'.
  if (!/^\d{1,2}$/.test(rawDay) || !/^\d{4}$/.test(rawYear)) return null;

  const d = Number(rawDay);
  const m = parseMonth(month);
  const y = Number(rawYear);
  if (!m) return null;

  const date = new Date(y, m - 1, d);
  const isReal =
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  return isReal ? date : null;
};

const yearsSince = (date) => {
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const beforeBirthdayThisYear =
    now.getMonth() < date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() < date.getDate());
  return beforeBirthdayThisYear ? age - 1 : age;
};

// One test for the whole date so the user gets one message, checked in the order
// GOV.UK recommends: nothing entered, then incomplete, then not a real date,
// then not in the past. It hangs off dobDay so focus lands on the first input.
const dateOfBirthTest = function dateOfBirthTest() {
  const { dobDay, dobMonth, dobYear } = this.parent;
  const parts = [dobDay, dobMonth, dobYear].map((v) => String(v ?? '').trim());
  const filled = parts.filter(Boolean);

  const fail = (message) => this.createError({ path: FIELDS.dobDay, message });

  if (filled.length === 0) return fail('Enter your date of birth.');
  if (filled.length < 3) {
    const missing = ['a day', 'a month', 'a year'].filter((_, i) => !parts[i]);
    return fail(`Your date of birth must include ${missing.join(' and ')}.`);
  }

  const date = buildDate(dobDay, dobMonth, dobYear);
  if (!date) {
    return fail('Your date of birth must be a real date, for example 27 3 2007.');
  }
  if (date > new Date()) return fail('Your date of birth must be in the past.');

  const age = yearsSince(date);
  if (age < MIN_AGE_YEARS) {
    return fail(`You must be at least ${MIN_AGE_YEARS} to apply. Check the year you entered.`);
  }
  if (age > 120) {
    return fail('That date of birth is over 120 years ago. Check the year you entered.');
  }

  return true;
};

// Three ordered checks instead of one regex, so each failure gets an accurate
// message. 7 is the shortest real E.164 number (Niue) and 15 is the maximum, so a
// tighter bound would reject real applicants. A false rejection loses someone
// silently; a false accept costs one follow-up email.
const phoneTest = function phoneTest(value) {
  if (!value) return true;
  const raw = String(value).trim();

  if (!/^[+()\d\s./-]+$/.test(raw)) {
    return this.createError({
      message: 'Your phone number can only contain digits, spaces, and + ( ) - . characters.',
    });
  }

  const plusCount = (raw.match(/\+/g) || []).length;
  if (plusCount > 1 || (plusCount === 1 && raw[0] !== '+')) {
    return this.createError({
      message: 'The + belongs at the start of your phone number, before the country code.',
    });
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) {
    return this.createError({ message: 'That phone number is too short. Include your country code.' });
  }
  if (digits.length > 15) {
    return this.createError({ message: 'That phone number is too long. Do not include an extension.' });
  }

  return true;
};

// Strict on the host and the /in/ path, permissive on the slug. The anchoring is
// what rejects linkedin.com.evil.com and evil.com/linkedin.com/in/x, which matters
// because a reviewer is going to click this link. The slug stays loose because
// LinkedIn's published rules govern what you may choose, not what it has generated.
const LINKEDIN_RE =
  /^(?:https?:\/\/)?(?:[a-z]{1,3}\.)?linkedin\.com\/(?:in|pub)\/[^/?#\s]+(?:\/[^/?#\s]+)*\/?(?:[?#].*)?$/i;

// Turns what people actually paste into one stored shape.
export const normaliseLinkedinUrl = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const withoutScheme = raw.replace(/^https?:\/\//i, '').replace(/^[a-z]{1,3}\.(?=linkedin\.com)/i, '');
  return `https://www.${withoutScheme.replace(/\/$/, '')}`;
};

export const applicationSchema = Yup.object({
  firstName: Yup.string()
    .trim()
    .required('Enter your first name.')
    .max(50, 'Your first name must be 50 characters or fewer.'),

  lastName: Yup.string()
    .trim()
    .required('Enter your last name.')
    .max(50, 'Your last name must be 50 characters or fewer.'),

  dobDay: Yup.string().test('date-of-birth', dateOfBirthTest),
  dobMonth: Yup.string(),
  dobYear: Yup.string(),

  citizenship: Yup.string()
    .required('Select your country of citizenship.')
    .oneOf(COUNTRY_CODES, 'Select your country of citizenship.'),

  address: Yup.string()
    .trim()
    .required('Enter your home address.')
    .min(10, 'Enter your full address, including the street and the city.')
    .max(300, 'Your address must be 300 characters or fewer.'),

  phone: Yup.string().required('Enter your phone number.').test('phone', phoneTest),

  preferredLanguage: Yup.string()
    .required('Select the language you would prefer we contact you in.')
    .oneOf(LANGUAGE_CODES, 'Select the language you would prefer we contact you in.'),

  preferredLanguageOther: Yup.string().when('preferredLanguage', {
    is: 'other',
    then: (schema) =>
      schema
        .trim()
        .required('Tell us which language you would prefer.')
        .max(60, 'That language name is too long.'),
    otherwise: (schema) => schema,
  }),

  // Holds the metadata returned by the upload, never a File. Guarded so an
  // unexpected shape produces a message instead of throwing inside Yup.
  cv: Yup.mixed()
    .required('Upload your CV.')
    .test('cv-uploaded', 'Your CV is still saving. Wait for it to finish.', (value) =>
      Boolean(value && typeof value === 'object' && value.cvDocId)
    ),

  hasLinkedin: Yup.string()
    .required('Select yes if you have a LinkedIn profile.')
    .oneOf(['yes', 'no'], 'Select yes if you have a LinkedIn profile.'),

  // The base schema carries no rules, so a stale value left behind after switching
  // to "no" cannot block submission on a field the user can no longer see.
  linkedinUrl: Yup.string().when('hasLinkedin', {
    is: 'yes',
    then: (schema) =>
      schema
        .trim()
        .required('Enter your LinkedIn profile URL, or select no above.')
        .matches(
          LINKEDIN_RE,
          'Enter a link to a LinkedIn profile, for example linkedin.com/in/your-name. Company and feed links are not accepted.'
        )
        .max(200, 'That URL is too long.'),
    otherwise: (schema) => schema,
  }),

  // Optional and asked after the review step, so it cannot read as a gate.
  gender: Yup.string(),
});

// Which fields each step is responsible for. The gate reads errors by these names,
// so they are taken from FIELDS rather than typed again.
export const STEPS = [
  {
    id: 'about',
    title: 'About you',
    fields: [FIELDS.firstName, FIELDS.lastName, FIELDS.dobDay, FIELDS.citizenship],
  },
  {
    id: 'contact',
    title: 'Contact details',
    fields: [
      FIELDS.address,
      FIELDS.phone,
      FIELDS.preferredLanguage,
      FIELDS.preferredLanguageOther,
    ],
  },
  {
    id: 'documents',
    title: 'Documents and profile',
    fields: [FIELDS.cv, FIELDS.hasLinkedin, FIELDS.linkedinUrl],
  },
  { id: 'review', title: 'Check your answers', fields: [] },
];
