// Vercel Edge Function — lightweight health check for the status indicator.
// Confirms the server has a key configured and (optionally) that Groq itself
// is reachable, without making a real chat request or costing tokens.
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, reason: 'not_configured' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + apiKey }
    });
    return new Response(JSON.stringify({ ok: res.ok, status: res.status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, reason: 'unreachable' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
