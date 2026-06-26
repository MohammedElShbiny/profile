const { getClient, checkAuth, jsonRes, errRes, corsPreflight } = require('../lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  if (!checkAuth(req)) return errRes('Unauthorized.', 401);

  try {
    const db = getClient();
    const [inquiries, projects, services, newInquiries] = await Promise.all([
      db.execute('SELECT COUNT(*) as cnt FROM inquiries'),
      db.execute('SELECT COUNT(*) as cnt FROM projects'),
      db.execute('SELECT COUNT(*) as cnt FROM services'),
      db.execute("SELECT COUNT(*) as cnt FROM inquiries WHERE status='new'"),
    ]);
    return jsonRes({
      total_inquiries: inquiries.rows[0].cnt,
      total_projects: projects.rows[0].cnt,
      total_services: services.rows[0].cnt,
      new_inquiries: newInquiries.rows[0].cnt,
    });
  } catch {
    return errRes('Failed to fetch stats.');
  }
};
