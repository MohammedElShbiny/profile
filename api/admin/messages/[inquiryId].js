const { getClient, checkAuth, jsonRes, errRes, corsPreflight, parseBody, getParam } = require('../../lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (!checkAuth(req)) return errRes('Unauthorized.', 401);

  const inquiryId = getParam(req.url, 'inquiryId');
  const db = getClient();

  if (req.method === 'GET') {
    try {
      const inquiryResult = await db.execute({ sql: 'SELECT id, name, email FROM inquiries WHERE id = ?', args: [inquiryId] });
      if (!inquiryResult.rows.length) return errRes('Inquiry not found.', 404);
      const messages = await db.execute({ sql: 'SELECT * FROM messages WHERE inquiry_id = ? ORDER BY created_at ASC', args: [inquiryId] });
      return jsonRes({ inquiry: inquiryResult.rows[0], messages: messages.rows });
    } catch {
      return errRes('Failed to fetch messages.');
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.message || !body.message.trim()) return errRes('Message is required.', 400);
      const exists = await db.execute({ sql: 'SELECT id FROM inquiries WHERE id = ?', args: [inquiryId] });
      if (!exists.rows.length) return errRes('Inquiry not found.', 404);
      await db.execute({ sql: 'INSERT INTO messages (inquiry_id, sender, message) VALUES (?, ?, ?)', args: [inquiryId, 'admin', body.message.trim()] });
      const result = await db.execute('SELECT last_insert_rowid() as id');
      return jsonRes({ success: true, id: result.rows[0].id }, 201);
    } catch {
      return errRes('Failed to send message.');
    }
  }

  return errRes('Method not allowed.', 405);
};
