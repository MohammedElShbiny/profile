const { getClient, checkAuth, jsonRes, errRes, corsPreflight, parseBody } = require('./lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  if (req.method === 'GET' && path === '/api/projects') {
    try {
      const db = getClient();
      const result = await db.execute('SELECT * FROM projects ORDER BY sort_order ASC');
      return jsonRes(result.rows);
    } catch {
      return errRes('Failed to fetch projects.');
    }
  }

  if (req.method === 'PUT' && path.match(/^\/api\/projects\/\d+$/)) {
    if (!checkAuth(req)) return errRes('Unauthorized.', 401);
    try {
      const id = path.split('/').pop();
      const db = getClient();
      const body = await parseBody(req);
      await db.execute({
        sql: `UPDATE projects SET title_en=?, title_ar=?, description_en=?, description_ar=?, status=?, gradient=?, icon=?, tech_stack=?, github_url=?, demo_url=?, sort_order=? WHERE id=?`,
        args: [body.title_en, body.title_ar, body.description_en, body.description_ar, body.status, body.gradient, body.icon, JSON.stringify(body.tech_stack || []), body.github_url, body.demo_url, body.sort_order, id],
      });
      return jsonRes({ success: true });
    } catch {
      return errRes('Failed to update project.');
    }
  }

  if (req.method === 'DELETE' && path.match(/^\/api\/projects\/\d+$/)) {
    if (!checkAuth(req)) return errRes('Unauthorized.', 401);
    try {
      const id = path.split('/').pop();
      const db = getClient();
      await db.execute({ sql: 'DELETE FROM projects WHERE id=?', args: [id] });
      return jsonRes({ success: true });
    } catch {
      return errRes('Failed to delete project.');
    }
  }

  return errRes('Not found.', 404);
};
