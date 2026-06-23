const { getClient, jsonRes, errRes } = require('./lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' } });
  }
  try {
    const db = getClient();
    const result = await db.execute('SELECT * FROM services ORDER BY sort_order ASC');
    return jsonRes(result.rows);
  } catch (err) {
    return errRes('Failed to fetch services.');
  }
};

module.exports.config = { api: { bodyParser: false } };
