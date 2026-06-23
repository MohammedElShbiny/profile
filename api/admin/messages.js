const { getClient, checkAuth, jsonRes, errRes } = require('../../lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization' } });
  }
  if (!checkAuth(req)) return errRes('Unauthorized.', 401);

  try {
    const db = getClient();
    const result = await db.execute(`
      SELECT i.id as inquiry_id, i.name, i.email, i.session_token,
        (SELECT message FROM messages WHERE inquiry_id = i.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT sender FROM messages WHERE inquiry_id = i.id ORDER BY created_at DESC LIMIT 1) as last_sender,
        (SELECT created_at FROM messages WHERE inquiry_id = i.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
        (SELECT COUNT(*) FROM messages WHERE inquiry_id = i.id AND sender = 'user' AND is_read = 0) as unread_count
      FROM inquiries i
      ORDER BY last_message_at DESC NULLS LAST
    `);
    return jsonRes(result.rows);
  } catch (err) {
    return errRes('Failed to fetch conversations.');
  }
};

module.exports.config = { api: { bodyParser: false } };
