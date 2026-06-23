const { getClient, jsonRes, errRes } = require('./lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }
  try {
    const { email } = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
    if (!email || !email.trim()) return errRes('Email is required.', 400);
    const db = getClient();
    const result = await db.execute({ sql: 'SELECT session_token FROM inquiries WHERE LOWER(email) = LOWER(?) LIMIT 1', args: [email.trim()] });
    if (!result.rows.length) return jsonRes({ success: false, error: 'No inquiry found for this email.' }, 404);
    return jsonRes({ success: true, token: result.rows[0].session_token });
  } catch (err) {
    return errRes('Failed to lookup inquiry.');
  }
};

module.exports.config = { api: { bodyParser: false } };
