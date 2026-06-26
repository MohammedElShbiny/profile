const { getClient, jsonRes, errRes, corsPreflight, parseBody } = require('./lib/db');
const crypto = require('crypto');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (req.method !== 'POST') return errRes('Method not allowed.', 405);

  try {
    const body = await parseBody(req);
    const { name, email, project_type, budget, message } = body;
    if (!name || !email || !project_type || !message) {
      return errRes('Name, email, project type, and message are required.', 400);
    }
    const db = getClient();
    const token = crypto.randomUUID();
    await db.execute({
      sql: 'INSERT INTO inquiries (name, email, project_type, budget, message, session_token) VALUES (?, ?, ?, ?, ?, ?)',
      args: [name, email, project_type, budget || '', message, token],
    });
    const result = await db.execute('SELECT last_insert_rowid() as id');
    return jsonRes({ success: true, id: result.rows[0].id, token, message: 'Inquiry submitted successfully.' }, 201);
  } catch {
    return errRes('Failed to submit inquiry.');
  }
};
