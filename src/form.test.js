// Renders each step and checks the things that are easy to break by accident and
// invisible when they are broken: label-to-input wiring, the conditional question,
// and button types. Run with `npm test`.
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Formik, Form } from 'formik';
import PersonalInfoStep from './components/steps/PersonalInfoStep';
import ContactStep from './components/steps/ContactStep';
import ReviewStep from './components/steps/ReviewStep';
import StepIndicator from './components/StepIndicator';
import DatePicker from './components/DatePicker';
import TicketPreview from './components/TicketPreview';
import { QRCodeSVG } from 'qrcode.react';
import SubmissionSuccess from './components/SubmissionSuccess';
import { applicationSchema, EMPTY_VALUES, STEPS } from './validation/applicationSchema';
import { parseCv } from './utils/parseCv';

// These tests are about what renders, not about uploading. Mocking the service keeps
// the Firebase SDK's Node build (and its undici/stream polyfill needs) out of jsdom.
jest.mock('./services/cvService', () => ({
  uploadCv: () => Promise.resolve(null),
  rejectionReason: () => null,
}));

jest.mock('./services/emailService', () => ({
  emailSummary: () => Promise.resolve({ success: true, message: 'sent' }),
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

test('ContactStep hides the LinkedIn URL until the user says yes', () => {
  expect(inForm(<ContactStep />, { ...FILLED, hasLinkedin: 'no' }))
    .not.toContain('LinkedIn profile URL');
  expect(inForm(<ContactStep />, FILLED)).toContain('LinkedIn profile URL');
});

test('the radio group is wrapped in a fieldset with a legend', () => {
  const html = inForm(<ContactStep />, FILLED);
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

describe('parseCv', () => {
  const CV = [
    'Gordon Yu',
    'gordonyu@college.harvard.edu | +1 617 555 0134',
    '12 Oxford Street, Cambridge, MA 02138, USA',
    'linkedin.com/in/gordon-yu',
    '',
    'EDUCATION',
  ].join('\n');

  test('pulls name, phone, address and LinkedIn out of CV text', () => {
    expect(parseCv(CV)).toEqual({
      firstName: 'Gordon',
      lastName: 'Yu',
      phone: '+1 617 555 0134',
      address: '12 Oxford Street, Cambridge, MA 02138, USA',
      linkedinUrl: 'linkedin.com/in/gordon-yu',
    });
  });

  test('skips a CURRICULUM VITAE heading when looking for the name', () => {
    expect(parseCv('CURRICULUM VITAE\n\nMaria Garcia Lopez\n+44 20 7183 8750')).toMatchObject({
      firstName: 'Maria',
      lastName: 'Lopez',
    });
  });

  test('does not run a phone match past the end of its line', () => {
    // The house number below used to get appended to the phone number.
    const { phone } = parseCv('Gordon Yu\n+1 617 555 0134\n12 Oxford Street, Cambridge');
    expect(phone).toBe('+1 617 555 0134');
  });

  test('does not mistake a run of years for a phone number', () => {
    expect(parseCv('Sam Patel\nHarvard University 2021 2025').phone).toBeUndefined();
  });

  test('returns nothing rather than guessing when there is no contact block', () => {
    expect(parseCv('SKILLS\nPython, React\nEDUCATION\nHarvard')).toEqual({});
  });

  test('handles accented names and non-US numbers', () => {
    expect(parseCv('José García\n+34 91 123 4567')).toMatchObject({
      firstName: 'José',
      lastName: 'García',
      phone: '+34 91 123 4567',
    });
  });
});

test('the CV step comes first, so autofill happens before anything is typed', () => {
  expect(STEPS[0].id).toBe('cv');
  expect(STEPS[0].fields).toEqual(['cv']);
  // The name and contact fields it fills are downstream of it.
  expect(STEPS[1].fields).toContain('firstName');
  expect(STEPS[2].fields).toContain('phone');
  expect(STEPS[2].fields).toContain('address');
});

test('the confirmation screen offers to email a copy, prefilled with the account address', () => {
  const html = renderToString(
    <SubmissionSuccess
      reference="AB12CD34"
      values={FILLED}
      defaultEmail="gordon@example.edu"
      onStartAnother={() => {}}
    />
  );
  expect(html).toContain('Email yourself a copy');
  expect(html).toContain('gordon@example.edu');
  expect(html).toContain('Download a copy (PDF)');
});

test('the ticket mirrors form values while the form is open', () => {
  const html = inForm(<TicketPreview />, FILLED);
  expect(html).toContain('Gordon Yu');
  expect(html).toContain('United States');
  expect(html).toContain('cv.pdf');
  // No reference until it is submitted.
  expect(html).toContain('PENDING');
});

test('the ticket shows blanks rather than breaking on an empty form', () => {
  const html = inForm(<TicketPreview />);
  expect(html).toContain('PENDING');
  expect(html).not.toContain('undefined');
});

test('the issued ticket carries the reference and a QR code', () => {
  const html = renderToString(
    <TicketPreview
      values={FILLED}
      reference="AB12CD34"
      qr={<QRCodeSVG value="HPAIR-AB12CD34" size={84} />}
    />
  );
  expect(html).toContain('AB12CD34');
  expect(html).toContain('ticket-issued');
  expect(html).toContain('<svg');
});
