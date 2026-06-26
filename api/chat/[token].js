const { getClient, jsonRes, errRes, corsPreflight, parseBody, getParam } = require('../../lib/db');

async function validateToken(token) {
  const db = getClient();
  const result = await db.execute({ sql: 'SELECT id, name, email FROM inquiries WHERE session_token = ?', args: [token] });
  if (!result.rows.length) return null;
  return result.rows[0];
}

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  const token = getParam(req.url, 'token');

  if (req.method === 'GET') {
    try {
      const inquiry = await validateToken(token);
      if (!inquiry) return errRes('Invalid session token.', 404);
      const db = getClient();
      const result = await db.execute({ sql: 'SELECT * FROM messages WHERE inquiry_id = ? ORDER BY created_at ASC', args: [inquiry.id] });
      return jsonRes({ inquiry, messages: result.rows });
    } catch {
      return errRes('Failed to fetch messages.');
    }
  }

  if (req.method === 'POST') {
    try {
      const inquiry = await validateToken(token);
      if (!inquiry) return errRes('Invalid session token.', 404);
      const body = await parseBody(req);
      if (!body.message || !body.message.trim()) return errRes('Message is required.', 400);
      const db = getClient();
      await db.execute({ sql: 'INSERT INTO messages (inquiry_id, sender, message) VALUES (?, ?, ?)', args: [inquiry.id, 'user', body.message.trim()] });
      const result = await db.execute('SELECT last_insert_rowid() as id');
      return jsonRes({ success: true, id: result.rows[0].id }, 201);
    } catch {
      return errRes('Failed to send message.');
    }
  }

  return errRes('Method not allowed.', 405);
};
