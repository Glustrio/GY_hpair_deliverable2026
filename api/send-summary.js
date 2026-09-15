// Runs on Vercel, not in the browser, which is the only reason the email API key can
// stay secret. Sends the applicant a copy of what they submitted.

const FIREBASE_LOOKUP = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

// Same public identifier as src/firebase/config.js. Not a secret, and inlining it
// means one fewer environment variable to get wrong.
const FIREBASE_API_KEY = 'AIzaSyClZzu2rYz8juxlNh8TUmAvakK0a6Lqz5M';

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const MAX_TRACKED = 5000;

// Per instance, not global. Vercel may run several, and a cold start clears this, so
// a determined caller can get more than five through. It stops the realistic case,
// which is someone holding down Send or looping a script against one instance.
// A durable limit needs shared storage; Vercel KV is the usual answer and is more
// infrastructure than this form justifies.
const sends = new Map();

const overLimit = (uid) => {
  const now = Date.now();

  // Without this the Map grows for the life of the instance, which is a slow leak.
  if (sends.size > MAX_TRACKED) {
    for (const [key, times] of sends) {
      if (!times.some((t) => now - t < WINDOW_MS)) sends.delete(key);
    }
  }

  const recent = (sends.get(uid) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    sends.set(uid, recent);
    return true;
  }

  sends.set(uid, [...recent, now]);
  return false;
};

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

  // Counted after the token check, so an unauthenticated caller cannot burn the quota
  // of a real user by guessing their uid.
  if (overLimit(user.localId)) {
    response.setHeader('Retry-After', String(WINDOW_MS / 1000));
    return response.status(429).json({
      error: `That is ${MAX_PER_WINDOW} emails in an hour. Try again later.`,
    });
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
