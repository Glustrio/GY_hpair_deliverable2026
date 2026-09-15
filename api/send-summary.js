// Runs on Vercel, not in the browser, which is the only reason the email API key can
// stay secret. Sends the applicant a copy of what they submitted.

const FIREBASE_LOOKUP = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

// Same public identifier as src/firebase/config.js. Not a secret, and inlining it
// means one fewer environment variable to get wrong.
const FIREBASE_API_KEY = 'AIzaSyClZzu2rYz8juxlNh8TUmAvakK0a6Lqz5M';

// Without this the endpoint is an open relay: anyone could POST to it and send mail
// from this domain. Exchanging the caller's Firebase ID token for a user proves the
// request came from someone signed in to the app.
const verify = async (idToken) => {
  const response = await fetch(`${FIREBASE_LOOKUP}?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) return null;
  const { users } = await response.json();
  return users?.[0] ?? null;
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Use POST.' });
  }

  const { idToken, to, reference, summary } = request.body ?? {};
  if (!idToken || !to || !summary) {
    return response.status(400).json({ error: 'Missing fields.' });
  }

  const user = await verify(idToken);
  if (!user) {
    return response.status(401).json({ error: 'Sign in again and retry.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return response.status(503).json({ error: 'Email is not configured on this deployment.' });
  }

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to,
      subject: `Your HPAIR application, reference ${reference}`,
      text: summary,
    }),
  });

  if (!sent.ok) {
    console.error('Resend rejected the send:', await sent.text());
    return response.status(502).json({ error: 'Could not send the email. Try again.' });
  }

  return response.status(200).json({ ok: true });
}
