// Asks the serverless function to email the applicant a copy. The browser cannot do
// this itself because it would have to hold the email provider's key.

import { auth } from '../firebase/config';
import { SUMMARY_SECTIONS, visibleRows, displayValue } from '../utils/submission';

const asText = (values, reference) => {
  const lines = [`HPAIR application`, `Reference ${reference}`, ''];
  SUMMARY_SECTIONS.forEach((section) => {
    lines.push(section.title.toUpperCase());
    visibleRows(section, values).forEach((row) => {
      lines.push(`  ${row.label}: ${displayValue(row.value(values))}`);
    });
    lines.push('');
  });
  return lines.join('\n');
};

// Sends the applicant's ID token along with the request. The function checks it, so
// the endpoint cannot be used by anyone who is not signed in to this app.
export const emailSummary = async (to, values, reference) => {
  try {
    // The function checks this token, so the endpoint cannot be used by strangers.
    const idToken = await auth.currentUser?.getIdToken();

    const response = await fetch('/api/send-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, to, reference, summary: asText(values, reference) }),
    });

    if (response.ok) return { success: true, message: `Sent to ${to}.` };

    // The dev server has no API routes, so it answers with its HTML page.
    if (response.status === 404) {
      return { success: false, message: 'Email only works on the deployed site, not locally.' };
    }

    const { error } = await response.json().catch(() => ({}));
    return { success: false, message: error || 'Could not send the email.' };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, message: 'Could not reach the email service.' };
  }
};
