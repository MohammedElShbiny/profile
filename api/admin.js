const { getClient, checkAuth, jsonRes, errRes, corsPreflight, parseBody } = require('./lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (!checkAuth(req)) return errRes('Unauthorized.', 401);

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  // GET /api/admin/stats
  if (req.method === 'GET' && path === '/api/admin/stats') {
    try {
      const db = getClient();
      const [inquiries, projects, services, newInquiries] = await Promise.all([
        db.execute('SELECT COUNT(*) as cnt FROM inquiries'),
        db.execute('SELECT COUNT(*) as cnt FROM projects'),
        db.execute('SELECT COUNT(*) as cnt FROM services'),
        db.execute("SELECT COUNT(*) as cnt FROM inquiries WHERE status='new'"),
      ]);
      return jsonRes({
        total_inquiries: inquiries.rows[0].cnt,
        total_projects: projects.rows[0].cnt,
        total_services: services.rows[0].cnt,
        new_inquiries: newInquiries.rows[0].cnt,
      });
    } catch {
      return errRes('Failed to fetch stats.');
    }
  }

  // GET /api/admin/inquiries
  if (req.method === 'GET' && path === '/api/admin/inquiries') {
    try {
      const db = getClient();
      const result = await db.execute('SELECT * FROM inquiries ORDER BY created_at DESC');
      return jsonRes(result.rows);
    } catch {
      return errRes('Failed to fetch inquiries.');
    }
  }

  // PUT /api/admin/inquiries/:id
  if (req.method === 'PUT' && path.match(/^\/api\/admin\/inquiries\/\d+$/)) {
    try {
      const id = path.split('/').pop();
      const body = await parseBody(req);
      const db = getClient();
      await db.execute({ sql: 'UPDATE inquiries SET status=? WHERE id=?', args: [body.status, id] });
      return jsonRes({ success: true });
    } catch {
      return errRes('Failed to update inquiry.');
    }
  }

  // GET /api/admin/messages
  if (req.method === 'GET' && path === '/api/admin/messages') {
    try {
      const db = getClient();
      const result = await db.execute(`
        SELECT i.id as inquiry_id, i.name, i.email, i.session_token,
          (SELECT message FROM messages WHERE inquiry_id = i.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT sender FROM messages WHERE inquiry_id = i.id ORDER BY created_at DESC LIMIT 1) as last_sender,
          (SELECT created_at FROM messages WHERE inquiry_id = i.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
          (SELECT COUNT(*) FROM messages WHERE inquiry_id = i.id AND sender = 'user' AND is_read = 0) as unread_count
        FROM inquiries i
        ORDER BY last_message_at IS NULL, last_message_at DESC
      `);
      return jsonRes(result.rows);
    } catch {
      return errRes('Failed to fetch conversations.');
    }
  }

  // GET /api/admin/messages/:inquiryId
  if (req.method === 'GET' && path.match(/^\/api\/admin\/messages\/\d+$/)) {
    try {
      const inquiryId = path.split('/').pop();
      const db = getClient();
      const inquiryResult = await db.execute({ sql: 'SELECT id, name, email FROM inquiries WHERE id = ?', args: [inquiryId] });
      if (!inquiryResult.rows.length) return errRes('Inquiry not found.', 404);
      const messages = await db.execute({ sql: 'SELECT * FROM messages WHERE inquiry_id = ? ORDER BY created_at ASC', args: [inquiryId] });
      return jsonRes({ inquiry: inquiryResult.rows[0], messages: messages.rows });
    } catch {
      return errRes('Failed to fetch messages.');
    }
  }

  // POST /api/admin/messages/:inquiryId
  if (req.method === 'POST' && path.match(/^\/api\/admin\/messages\/\d+$/)) {
    try {
      const inquiryId = path.split('/').pop();
      const body = await parseBody(req);
      if (!body.message || !body.message.trim()) return errRes('Message is required.', 400);
      const db = getClient();
      const exists = await db.execute({ sql: 'SELECT id FROM inquiries WHERE id = ?', args: [inquiryId] });
      if (!exists.rows.length) return errRes('Inquiry not found.', 404);
      await db.execute({ sql: 'INSERT INTO messages (inquiry_id, sender, message) VALUES (?, ?, ?)', args: [inquiryId, 'admin', body.message.trim()] });
      const result = await db.execute('SELECT last_insert_rowid() as id');
      return jsonRes({ success: true, id: result.rows[0].id }, 201);
    } catch {
      return errRes('Failed to send message.');
    }
  }

  return errRes('Not found.', 404);
};
