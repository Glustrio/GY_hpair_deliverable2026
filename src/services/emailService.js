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

    const { error } = await response.json().catch(() => ({}));
    return { success: false, message: error || 'Could not send the email.' };
  } catch (error) {
    console.error('Email error:', error);
    // The API route does not exist under `npm start`, only on the deployment.
    return { success: false, message: 'Email is only available on the deployed site.' };
  }
};
