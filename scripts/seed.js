require('dotenv').config();
const { initDb, seedIfEmpty } = require('../api/lib/db');

(async () => {
  await initDb();
  await seedIfEmpty();
  console.log('Database initialized and seeded successfully!');
})();
