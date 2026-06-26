const { getClient, jsonRes, errRes, corsPreflight, parseQuery } = require('./lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  try {
    const { email } = parseQuery(req.url);
    if (!email || !email.trim()) return errRes('Email is required.', 400);
    const db = getClient();
    const result = await db.execute({
      sql: 'SELECT session_token FROM inquiries WHERE LOWER(email) = LOWER(?) LIMIT 1',
      args: [email.trim()],
    });
    if (!result.rows.length) return jsonRes({ success: false, error: 'No inquiry found for this email.' }, 404);
    return jsonRes({ success: true, token: result.rows[0].session_token });
  } catch {
    return errRes('Failed to lookup inquiry.');
  }
};
