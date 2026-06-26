const { getClient, checkAuth, jsonRes, errRes, corsPreflight, parseBody, getParam } = require('../../lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (!checkAuth(req)) return errRes('Unauthorized.', 401);
  if (req.method !== 'PUT') return errRes('Method not allowed.', 405);

  try {
    const id = getParam(req.url, 'id');
    const body = await parseBody(req);
    const db = getClient();
    await db.execute({ sql: 'UPDATE inquiries SET status=? WHERE id=?', args: [body.status, id] });
    return jsonRes({ success: true });
  } catch {
    return errRes('Failed to update inquiry.');
  }
};
