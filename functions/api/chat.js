/**
 * Cloudflare Pages Function: functions/api/chat.js
 * Site chatbot powered by Google Gemini (GEMINI_API_KEY env).
 */
import { detectAbuse, getAbuseReply, callGemini } from '../_lib/chat-knowledge.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  const API_KEY = env.GEMINI_API_KEY;
  if (!API_KEY) {
    return new Response(
      JSON.stringify({
        reply: '🤖 API Key missing. Set GEMINI_API_KEY in Cloudflare Pages → Settings → Environment variables.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const message = (body.message || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return new Response(JSON.stringify({ reply: '⚠️ Please enter a message.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
    console.error('Chat Function Error:', err);
    return new Response(
      JSON.stringify({
        reply:
          '🤖 Temporary AI issue. Try again, or contact admin:\nhttps://hsbteleet.com/contact\nhttps://wa.me/919992507270\n\n(' +
          (err.message || 'error') +
          ')'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
