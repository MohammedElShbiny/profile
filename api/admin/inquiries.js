const { getClient, checkAuth, jsonRes, errRes } = require('../lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization' } });
  }
  if (!checkAuth(req)) return errRes('Unauthorized.', 401);

  try {
    const db = getClient();
    const result = await db.execute('SELECT * FROM inquiries ORDER BY created_at DESC');
    return jsonRes(result.rows);
  } catch (err) {
    return errRes('Failed to fetch inquiries.');
  }
};

module.exports.config = { api: { bodyParser: false } };
