const { getClient, checkAuth, jsonRes, errRes, parseBody } = require('../lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type' } });
  }
  const { id } = req.query;

  if (req.method === 'PUT') {
    if (!checkAuth(req)) return errRes('Unauthorized.', 401);
    try {
      const db = getClient();
      const body = await parseBody(req);
      await db.execute({
        sql: `UPDATE services SET name_en=?, name_ar=?, price_egp=?, description_en=?, description_ar=?, features_en=?, features_ar=?, is_popular=?, sort_order=? WHERE id=?`,
        args: [body.name_en, body.name_ar, body.price_egp, body.description_en, body.description_ar, JSON.stringify(body.features_en || []), JSON.stringify(body.features_ar || []), body.is_popular ? 1 : 0, body.sort_order, id]
      });
      return jsonRes({ success: true });
    } catch (err) {
      return errRes('Failed to update service.');
    }
  }

  if (req.method === 'DELETE') {
    if (!checkAuth(req)) return errRes('Unauthorized.', 401);
    try {
      const db = getClient();
      await db.execute({ sql: 'DELETE FROM services WHERE id=?', args: [id] });
      return jsonRes({ success: true });
    } catch (err) {
      return errRes('Failed to delete service.');
    }
  }

  return errRes('Method not allowed.', 405);
};

module.exports.config = { api: { bodyParser: false } };
