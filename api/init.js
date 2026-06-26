const { initDb, seedIfEmpty, jsonRes, corsPreflight } = require('./lib/db');

module.exports = async function handler(req) {
  if (req.method === 'OPTIONS') return corsPreflight();
  try {
    await initDb();
    await seedIfEmpty();
  } catch {}
  return jsonRes({ ok: true });
};
