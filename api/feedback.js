// Vercel Edge Function — emails feedback/bug reports and new-signup pings to the
// app owner via Resend. The Resend API key lives only in Vercel's environment
// variables, never in the browser.
export const config = { runtime: 'edge' };

const OWNER_EMAIL = 'sakharibornita5@gmail.com';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return json({ error: 'Server is missing RESEND_API_KEY.' }, 500);
  }

  let body;
  try { body = await req.json(); }
  catch (e) { return json({ error: 'Invalid body' }, 400); }

  const { type, message, username, replyTo } = body || {};
  const who = escapeHtml(String(username || 'anonymous').slice(0, 120));

  let subject, html;

  if (type === 'signup') {
    subject = `[Conduit] New account: ${String(username || 'unknown').slice(0, 80)}`;
    html = `
      <h2>Someone created a new account</h2>
      <p><strong>Username:</strong> ${who}</p>
      <p><strong>When:</strong> ${new Date().toISOString()}</p>
    `;
  } else {
    const safeMsg = escapeHtml(String(message || '').slice(0, 5000));
    if (!safeMsg) return json({ error: 'Empty message' }, 400);
    const label = String(type || 'Feedback').slice(0, 40);
    subject = `[Conduit] ${label} from ${String(username || 'a user').slice(0, 80)}`;
    html = `
      <h2>New ${escapeHtml(label)} submitted</h2>
      <p><strong>From:</strong> ${who}</p>
      ${replyTo ? `<p><strong>Reply to:</strong> ${escapeHtml(String(replyTo).slice(0, 200))}</p>` : ''}
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:inherit;background:#f6f7f5;padding:12px;border-radius:8px;">${safeMsg}</pre>
    `;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + resendKey
    },
    body: JSON.stringify({
      from: 'Conduit <onboarding@resend.dev>',
      to: [OWNER_EMAIL],
      subject,
      html,
      ...(replyTo ? { reply_to: String(replyTo).slice(0, 200) } : {})
    })
  });

  if (!res.ok) {
    const detail = await res.text();
    return json({ error: 'Email send failed', detail }, 502);
  }

  return json({ ok: true }, 200);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
