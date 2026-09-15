// The applicant's answers as a conference ticket, filling in live as they type. Before
// submitting it is a preview with a placeholder reference; after, it carries the real
// one and a QR code.
import React from 'react';
import { useFormikContext } from 'formik';
import { FIELDS } from '../validation/applicationSchema';
import { countryName, languageName } from '../utils/submission';

const blank = '—';

const TicketPreview = ({ reference, qr, values: given }) => {
  // Reads Formik while the form is open, or takes a snapshot once it is submitted.
  const context = useFormikContext();
  const values = given ?? context?.values ?? {};

  const first = values[FIELDS.firstName]?.trim();
  const last = values[FIELDS.lastName]?.trim();
  const name = [first, last].filter(Boolean).join(' ');

  return (
    <div className={`ticket${reference ? ' ticket-issued' : ''}`}>
      <div className="ticket-body">
        <p className="ticket-event">HPAIR</p>
        <p className="ticket-label">Applicant</p>
        <p className="ticket-name">{name || blank}</p>

        <dl className="ticket-rows">
          <div>
            <dt>Nationality</dt>
            <dd>{values[FIELDS.citizenship] ? countryName(values[FIELDS.citizenship]) : blank}</dd>
          </div>
          <div>
            <dt>Language</dt>
            <dd>
              {values[FIELDS.preferredLanguage] === 'other'
                ? values[FIELDS.preferredLanguageOther] || blank
                : values[FIELDS.preferredLanguage]
                  ? languageName(values[FIELDS.preferredLanguage])
                  : blank}
            </dd>
          </div>
          <div>
            <dt>CV</dt>
            <dd>{values[FIELDS.cv]?.fileName ?? blank}</dd>
          </div>
        </dl>
      </div>

      <div className="ticket-stub">
        {qr ?? <div className="ticket-qr-placeholder" aria-hidden="true" />}
        <p className="ticket-reference">{reference ?? 'PENDING'}</p>
      </div>
    </div>
  );
};

export default TicketPreview;
