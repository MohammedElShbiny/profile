const { getClient, checkAuth, jsonRes, errRes, parseBody } = require('../../lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'PUT, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' } });
  }
  if (!checkAuth(req)) return errRes('Unauthorized.', 401);
  if (req.method !== 'PUT') return errRes('Method not allowed.', 405);

  try {
    const { id } = req.query;
    const body = await parseBody(req);
    const db = getClient();
    await db.execute({ sql: 'UPDATE inquiries SET status=? WHERE id=?', args: [body.status, id] });
    return jsonRes({ success: true });
  } catch (err) {
    return errRes('Failed to update inquiry.');
  }
};

module.exports.config = { api: { bodyParser: false } };
