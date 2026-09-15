// The applicant's answers as a conference ticket, filling in live as they type. Before
// submitting it is a preview with a placeholder reference; after, it carries the real
// one and a QR code.
import React, { useRef, useState } from 'react';
import { useFormikContext } from 'formik';
import { FIELDS } from '../validation/applicationSchema';
import { countryName, languageName } from '../utils/submission';

const blank = '—';
const MAX_TILT = 14;

// Tilts toward the cursor and moves a highlight with it. Position goes out as CSS
// custom properties, so the stylesheet owns the effect and can switch it off under
// prefers-reduced-motion without this file knowing that setting exists.
const useTilt = () => {
  const ref = useRef(null);
  const frame = useRef(null);
  const [tracking, setTracking] = useState(false);

  const onMouseMove = (event) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;

    // One write per frame. mousemove fires far faster than the screen refreshes, and
    // without this every event triggers its own style recalculation.
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty('--tilt-y', `${(x - 0.5) * 2 * MAX_TILT}deg`);
      el.style.setProperty('--tilt-x', `${(0.5 - y) * 2 * MAX_TILT}deg`);
      el.style.setProperty('--shine-x', `${x * 100}%`);
      el.style.setProperty('--shine-y', `${y * 100}%`);
    });
  };

  const onMouseLeave = () => {
    cancelAnimationFrame(frame.current);
    setTracking(false);
    const el = ref.current;
    if (!el) return;
    el.style.removeProperty('--tilt-y');
    el.style.removeProperty('--tilt-x');
  };

  // While tracking, the transition is removed so the tilt follows the cursor exactly
  // rather than trailing behind it. It comes back on the way out, so the card settles
  // instead of snapping flat.
  return {
    ref,
    onMouseMove,
    onMouseEnter: () => setTracking(true),
    onMouseLeave,
    className: tracking ? ' ticket-tracking' : '',
  };
};

const TicketPreview = ({ reference, qr, values: given }) => {
  // Reads Formik while the form is open, or takes a snapshot once it is submitted.
  const context = useFormikContext();
  const values = given ?? context?.values ?? {};
  const tilt = useTilt();

  const first = values[FIELDS.firstName]?.trim();
  const last = values[FIELDS.lastName]?.trim();
  const name = [first, last].filter(Boolean).join(' ');

  return (
    <div
      className={`ticket${reference ? ' ticket-issued' : ''}${tilt.className}`}
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseEnter={tilt.onMouseEnter}
      onMouseLeave={tilt.onMouseLeave}
    >
      <div className="ticket-shine" aria-hidden="true" />
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
