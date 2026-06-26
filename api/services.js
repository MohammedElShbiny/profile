const { getClient, checkAuth, jsonRes, errRes, corsPreflight, parseBody } = require('./lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  if (req.method === 'GET' && path === '/api/services') {
    try {
      const db = getClient();
      const result = await db.execute('SELECT * FROM services ORDER BY sort_order ASC');
      return jsonRes(result.rows);
    } catch {
      return errRes('Failed to fetch services.');
    }
  }

  if (req.method === 'PUT' && path.match(/^\/api\/services\/\d+$/)) {
    if (!checkAuth(req)) return errRes('Unauthorized.', 401);
    try {
      const id = path.split('/').pop();
      const db = getClient();
      const body = await parseBody(req);
      await db.execute({
        sql: `UPDATE services SET name_en=?, name_ar=?, price_egp=?, description_en=?, description_ar=?, features_en=?, features_ar=?, is_popular=?, sort_order=? WHERE id=?`,
        args: [body.name_en, body.name_ar, body.price_egp, body.description_en, body.description_ar, JSON.stringify(body.features_en || []), JSON.stringify(body.features_ar || []), body.is_popular ? 1 : 0, body.sort_order, id],
      });
      return jsonRes({ success: true });
    } catch {
      return errRes('Failed to update service.');
    }
  }

  if (req.method === 'DELETE' && path.match(/^\/api\/services\/\d+$/)) {
    if (!checkAuth(req)) return errRes('Unauthorized.', 401);
    try {
      const id = path.split('/').pop();
      const db = getClient();
      await db.execute({ sql: 'DELETE FROM services WHERE id=?', args: [id] });
      return jsonRes({ success: true });
    } catch {
      return errRes('Failed to delete service.');
    }
  }

  return errRes('Not found.', 404);
};
