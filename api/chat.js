export const config = {
  runtime: 'edge'
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: { message: 'Method not allowed' }
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'GROQ_API_KEY is missing from Vercel.'
        }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  let body;

  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: { message: 'Invalid JSON request body.' }
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const groqBody = {
    model: 'openai/gpt-oss-120b',
    messages: body.messages,
    stream: true
  };

  try {
    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(groqBody)
      }
    );

    if (!groqRes.ok) {
      const detail = await groqRes.text();

      return new Response(
        JSON.stringify({
          error: {
            message: `Groq returned HTTP ${groqRes.status}: ${detail}`
          }
        }),
        {
          status: groqRes.status,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return new Response(groqRes.body, {
      status: 200,
      headers: {
        'Content-Type':
          groqRes.headers.get('Content-Type') || 'text/event-stream'
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          message: error?.message || 'Failed to connect to Groq.'
        }
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
