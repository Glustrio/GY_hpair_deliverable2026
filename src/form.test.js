// Renders each step and checks the things that are easy to break by accident and
// invisible when they are broken: label-to-input wiring, the conditional question,
// and button types. Run with `npm test`.
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Formik, Form } from 'formik';
import PersonalInfoStep from './components/steps/PersonalInfoStep';
import ContactStep from './components/steps/ContactStep';
import DocumentsStep from './components/steps/DocumentsStep';
import ReviewStep from './components/steps/ReviewStep';
import StepIndicator from './components/StepIndicator';
import DatePicker from './components/DatePicker';
import SubmissionSuccess from './components/SubmissionSuccess';
import { applicationSchema, EMPTY_VALUES, STEPS } from './validation/applicationSchema';

// These tests are about what renders, not about uploading. Mocking the service keeps
// the Firebase SDK's Node build (and its undici/stream polyfill needs) out of jsdom.
jest.mock('./services/cvService', () => ({
  uploadCv: () => Promise.resolve(null),
  rejectionReason: () => null,
}));

const FILLED = {
  ...EMPTY_VALUES,
  firstName: 'Gordon', lastName: 'Yu', dobDay: '27', dobMonth: '3', dobYear: '2005',
  citizenship: 'US', address: '12 Oxford Street, Cambridge MA 02138',
  phone: '+1 617 555 0134', preferredLanguage: 'en',
  cv: { cvDocId: 'u1_abc', fileName: 'cv.pdf', sizeBytes: 2048, contentType: 'application/pdf' },
  hasLinkedin: 'yes', linkedinUrl: 'linkedin.com/in/gordon',
};

const inForm = (node, values = EMPTY_VALUES) =>
  renderToString(
    <Formik initialValues={values} validationSchema={applicationSchema} onSubmit={() => {}}>
      <Form>{node}</Form>
    </Formik>
  );

test('PersonalInfoStep renders with the country list', () => {
  const html = inForm(<PersonalInfoStep />);
  expect(html).toContain('Nationality');
  expect(html).toContain('Afghanistan');
  expect(html).toContain('Kosovo');
  expect(html).not.toContain('Antarctica');
  expect(html).toContain('for="dobDay"');
});

test('every input has a label pointing at a real id', () => {
  const html = inForm(<PersonalInfoStep />) + inForm(<ContactStep />);
  const labelled = [...html.matchAll(/for="([^"]+)"/g)].map((m) => m[1]);
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  labelled.forEach((target) => expect(ids).toContain(target));
  expect(labelled.length).toBeGreaterThan(5);
});

test('ContactStep uses a textarea for the address, which is what street-address requires', () => {
  const html = inForm(<ContactStep />);
  expect(html).toMatch(/<textarea[^>]*autocomplete="street-address"/i);
  expect(html).toMatch(/type="tel"/);
});

test('DocumentsStep hides the LinkedIn URL until the user says yes', () => {
  expect(inForm(<DocumentsStep userId="u1" />, { ...FILLED, hasLinkedin: 'no' }))
    .not.toContain('LinkedIn profile URL');
  expect(inForm(<DocumentsStep userId="u1" />, FILLED)).toContain('LinkedIn profile URL');
});

test('the radio group is wrapped in a fieldset with a legend', () => {
  const html = inForm(<DocumentsStep userId="u1" />, FILLED);
  expect(html).toContain('<legend');
  expect(html).toContain('Do you have a LinkedIn profile?');
  expect(html).toContain('type="radio"');
});

test('ReviewStep shows answers and normalises the LinkedIn URL', () => {
  const html = inForm(<ReviewStep onEditStep={() => {}} />, FILLED);
  expect(html).toContain('Gordon');
  expect(html).toContain('2005-03-27');
  expect(html).toContain('United States');
  expect(html).toContain('https://www.linkedin.com/in/gordon');
  expect(html).toContain('cv.pdf');
});

test('ReviewStep omits the LinkedIn row when the answer is no', () => {
  const html = inForm(<ReviewStep onEditStep={() => {}} />, { ...FILLED, hasLinkedin: 'no' });
  expect(html).not.toContain('linkedin.com/in/gordon');
});

test('every Edit button is type=button, or clicking one submits the form', () => {
  const html = inForm(<ReviewStep onEditStep={() => {}} />, FILLED);
  [...html.matchAll(/<button([^>]*)>/g)].forEach((m) => expect(m[1]).toContain('type="button"'));
});

test('StepIndicator is hidden from assistive tech and marks completed steps', () => {
  const html = renderToString(<StepIndicator steps={STEPS} currentIndex={2} />);
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('✓');
  expect(html).toContain('active');
});

test('SubmissionSuccess shows the reference and the answers', () => {
  const html = renderToString(
    <SubmissionSuccess reference="AB12CD34" values={FILLED} onStartAnother={() => {}} />
  );
  expect(html).toContain('AB12CD34');
  expect(html).toContain('Application sent');
  expect(html).toContain('Gordon');
});

test('DatePicker offers month and year selects, not month arrows', () => {
  const html = renderToString(
    <DatePicker
      value={new Date(2005, 2, 27)}
      min={new Date(1906, 0, 1)}
      max={new Date(2013, 0, 1)}
      onPick={() => {}}
      onClose={() => {}}
    />
  );
  expect(html).toContain('id="dp-month"');
  expect(html).toContain('id="dp-year"');
  expect(html).toContain('>March<');
  expect(html).toContain('>1906<');
  expect(html).toContain('>2013<');
  expect(html).toContain('role="grid"');
});

test('DatePicker marks exactly one cell selected and one tabbable', () => {
  const html = renderToString(
    <DatePicker
      value={new Date(2005, 2, 27)}
      min={new Date(1906, 0, 1)}
      max={new Date(2013, 0, 1)}
      onPick={() => {}}
      onClose={() => {}}
    />
  );
  // Roving tabindex: the grid must be a single tab stop.
  expect(html.match(/tabindex="0"/g)).toHaveLength(1);
  expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
});

test('ContactStep reveals a text box when the language is not in the list', () => {
  expect(inForm(<ContactStep />, { ...FILLED, preferredLanguage: 'en' }))
    .not.toContain('Which language?');
  const html = inForm(<ContactStep />, { ...FILLED, preferredLanguage: 'other' });
  expect(html).toContain('Which language?');
  expect(html).toContain('id="preferredLanguageOther"');
});

test('the language list covers the ISO 639-1 set, not a shortlist', () => {
  const html = inForm(<ContactStep />);
  ['Filipino', 'Swahili', 'Welsh', 'Bangla', 'Yoruba'].forEach((name) =>
    expect(html).toContain(`>${name}<`)
  );
  expect(html).toContain('>Another language<');
});
