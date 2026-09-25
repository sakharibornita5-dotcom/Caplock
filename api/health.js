// Vercel Edge Function — checks whether the xAI/Grok API is reachable.

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        reason: 'not_configured'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  try {
    const res = await fetch(
      'https://api.x.ai/v1/models',
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + apiKey
        }
      }
    );

    return new Response(
      JSON.stringify({
        ok: res.ok,
        status: res.status
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        reason: 'unreachable'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
