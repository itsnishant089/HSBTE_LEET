/**
 * Vercel Edge Function: api/chat.js
 * Site chatbot powered by Google Gemini (GEMINI_API_KEY env).
 */
import { detectAbuse, getAbuseReply, callGemini } from '../shared/chat-knowledge.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return new Response(
      JSON.stringify({ reply: '🤖 API Key missing. Set GEMINI_API_KEY in environment variables.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const message = (body.message || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return new Response(JSON.stringify({ reply: '⚠️ Please enter a message.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Gaali → gaali (local roast; reliable even if Gemini safety blocks)
    if (detectAbuse(message)) {
      return new Response(JSON.stringify({ reply: getAbuseReply() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const reply = await callGemini({ apiKey: API_KEY, message, history });
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Chat API error:', err);
    return new Response(
      JSON.stringify({
        reply:
          '🤖 Temporary AI issue. Try again, or contact admin:\nhttps://hsbteleet.com/contact\nhttps://wa.me/919992507270'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
