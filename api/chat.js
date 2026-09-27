// Vercel Edge Function — proxies chat requests to Groq using a server-side
// API key (set in Vercel's Environment Variables, never exposed to the browser).
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: { message: 'Method not allowed' } }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: { message: 'Server is missing GROQ_API_KEY. Set it in Vercel → Settings → Environment Variables.' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: { message: 'Invalid request body' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify(body)
  });

  const passthroughHeaders = {
    'Content-Type': groqRes.headers.get('Content-Type') || 'application/json'
  };
  // Relay rate-limit info so the client can warn users before they hit a hard limit.
  ['x-ratelimit-limit-requests', 'x-ratelimit-remaining-requests', 'x-ratelimit-reset-requests',
   'x-ratelimit-limit-tokens', 'x-ratelimit-remaining-tokens', 'x-ratelimit-reset-tokens',
   'retry-after'].forEach((h) => {
    const v = groqRes.headers.get(h);
    if (v) passthroughHeaders[h] = v;
  });

  return new Response(groqRes.body, {
    status: groqRes.status,
    headers: passthroughHeaders
  });
}
