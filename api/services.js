const { getClient, jsonRes, errRes, corsPreflight } = require('./lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  try {
    const db = getClient();
    const result = await db.execute('SELECT * FROM services ORDER BY sort_order ASC');
    return jsonRes(result.rows);
  } catch {
    return errRes('Failed to fetch services.');
  }
};
