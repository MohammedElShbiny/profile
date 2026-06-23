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
        sql: `UPDATE projects SET title_en=?, title_ar=?, description_en=?, description_ar=?, status=?, gradient=?, icon=?, tech_stack=?, github_url=?, demo_url=?, sort_order=? WHERE id=?`,
        args: [body.title_en, body.title_ar, body.description_en, body.description_ar, body.status, body.gradient, body.icon, JSON.stringify(body.tech_stack || []), body.github_url, body.demo_url, body.sort_order, id]
      });
      return jsonRes({ success: true });
    } catch (err) {
      return errRes('Failed to update project.');
    }
  }

  if (req.method === 'DELETE') {
    if (!checkAuth(req)) return errRes('Unauthorized.', 401);
    try {
      const db = getClient();
      await db.execute({ sql: 'DELETE FROM projects WHERE id=?', args: [id] });
      return jsonRes({ success: true });
    } catch (err) {
      return errRes('Failed to delete project.');
    }
  }

  return errRes('Method not allowed.', 405);
};

module.exports.config = { api: { bodyParser: false } };
