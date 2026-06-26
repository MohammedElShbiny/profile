const { getClient, jsonRes, errRes, corsPreflight, getParam } = require('../../../lib/db');

async function validateToken(token) {
  const db = getClient();
  const result = await db.execute({ sql: 'SELECT id, name, email FROM inquiries WHERE session_token = ?', args: [token] });
  if (!result.rows.length) return null;
  return result.rows[0];
}

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'GET') return errRes('Method not allowed.', 405);

  try {
    const token = getParam(req.url, 'token');
    const inquiry = await validateToken(token);
    if (!inquiry) return errRes('Invalid session token.', 404);
    const db = getClient();
    const result = await db.execute({ sql: "SELECT * FROM messages WHERE inquiry_id = ? AND sender = 'admin' AND is_read = 0 ORDER BY created_at ASC", args: [inquiry.id] });
    const unread = result.rows;
    if (unread.length > 0) {
      const ids = unread.map(m => m.id);
      await db.execute({ sql: `UPDATE messages SET is_read = 1 WHERE id IN (${ids.join(',')})` });
    }
    return jsonRes({ unread });
  } catch {
    return errRes('Failed to check unread messages.');
  }
};
