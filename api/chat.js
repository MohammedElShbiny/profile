const { getClient, jsonRes, errRes, corsPreflight, parseBody } = require('./lib/db');

async function validateToken(token) {
  const db = getClient();
  const result = await db.execute({ sql: 'SELECT id, name, email FROM inquiries WHERE session_token = ?', args: [token] });
  if (!result.rows.length) return null;
  return result.rows[0];
}

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  // Extract token from /api/chat/:token or /api/chat/:token/unread
  const chatMatch = path.match(/^\/api\/chat\/([^/]+)(\/unread)?$/);
  if (!chatMatch) return errRes('Not found.', 404);
  const token = decodeURIComponent(chatMatch[1]);
  const isUnread = !!chatMatch[2];

  // GET /api/chat/:token/unread
  if (req.method === 'GET' && isUnread) {
    try {
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
  }

  // GET /api/chat/:token
  if (req.method === 'GET' && !isUnread) {
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

  // POST /api/chat/:token
  if (req.method === 'POST' && !isUnread) {
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
