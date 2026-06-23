const { initDb, seedIfEmpty, jsonRes, errRes } = require('./lib/db');

module.exports = async function handler(req) {
  try {
    await initDb();
    await seedIfEmpty();
  } catch (e) {}
  return jsonRes({ ok: true });
};
