const { getClient, checkAuth, jsonRes, errRes, corsPreflight } = require('../lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (!checkAuth(req)) return errRes('Unauthorized.', 401);

  try {
    const db = getClient();
    const result = await db.execute('SELECT * FROM inquiries ORDER BY created_at DESC');
    return jsonRes(result.rows);
  } catch {
    return errRes('Failed to fetch inquiries.');
  }
};
