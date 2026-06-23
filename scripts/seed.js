const { createClient } = require('@libsql/client');
const crypto = require('crypto');
require('dotenv').config();

async function seed() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) { console.error('TURSO_DATABASE_URL not set. Check .env'); process.exit(1); }

  const db = createClient({ url, authToken });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL, title_ar TEXT NOT NULL,
      description_en TEXT NOT NULL, description_ar TEXT NOT NULL,
      status TEXT DEFAULT 'live', gradient TEXT NOT NULL, icon TEXT NOT NULL,
      tech_stack TEXT NOT NULL DEFAULT '[]', github_url TEXT DEFAULT '#', demo_url TEXT DEFAULT '#',
      sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL, name_ar TEXT NOT NULL, price_egp INTEGER NOT NULL,
      description_en TEXT NOT NULL, description_ar TEXT NOT NULL,
      features_en TEXT NOT NULL DEFAULT '[]', features_ar TEXT NOT NULL DEFAULT '[]',
      is_popular INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, email TEXT NOT NULL, project_type TEXT NOT NULL,
      budget TEXT, message TEXT NOT NULL, status TEXT DEFAULT 'new',
      session_token TEXT, created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT, inquiry_id INTEGER NOT NULL,
      sender TEXT NOT NULL, message TEXT NOT NULL, is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
    )
  `);

  const count = await db.execute('SELECT COUNT(*) as cnt FROM projects');
  if (count.rows[0].cnt > 0) { console.log('Database already seeded.'); return; }

  const projects = [
    { title_en: 'Quantum Dashboard', title_ar: 'لوحة كم الحوسبة', description_en: 'Real-time analytics dashboard with AI-powered insights and predictive modeling.', description_ar: 'لوحة تحليلات فورية مع رؤى مدعومة بالذكاء الاصطناعي ونمذجة تنبؤية.', status: 'live', gradient: 'linear-gradient(135deg,#0070f3 0%,#7759fb 100%)', icon: 'dashboard', tech_stack: JSON.stringify(['React', 'TypeScript', 'Node.js', 'AI']), sort_order: 1 },
    { title_en: 'SyncFit Pro', title_ar: 'سينك فيت برو', description_en: 'Cross-platform fitness tracking app with AI workout recommendations and progress analytics.', description_ar: 'تطبيق لياقة بدنية متعدد المنصات مع توصيات تمارين بالذكاء الاصطناعي.', status: 'live', gradient: 'linear-gradient(135deg,#00b954 0%,#4ae176 100%)', icon: 'sync', tech_stack: JSON.stringify(['Android', 'Kotlin', 'Node.js']), sort_order: 2 },
    { title_en: 'Forge Architect', title_ar: 'فورج أركيتيكت', description_en: 'Restaurant management system with real-time inventory tracking and AI-powered ordering.', description_ar: 'نظام إدارة مطاعم مع تتبع المخزون الفوري والطلبات بالذكاء الاصطناعي.', status: 'maintenance', gradient: 'linear-gradient(135deg,#512bd4 0%,#c9beff 100%)', icon: 'architecture', tech_stack: JSON.stringify(['React', 'Node.js', 'AI']), sort_order: 3 },
    { title_en: 'Aether API Gateway', title_ar: 'إيثر بوابة API', description_en: 'Scalable API gateway with intelligent rate limiting, caching, and real-time monitoring.', description_ar: 'بوابة API قابلة للتوسع مع تحديد المعدل الذكي والتخزين المؤقت والمراقبة الفورية.', status: 'live', gradient: 'linear-gradient(135deg,#0070f3 0%,#4ae176 100%)', icon: 'cloud', tech_stack: JSON.stringify(['Node.js', 'TypeScript', 'AI']), sort_order: 4 }
  ];
  for (const p of projects) {
    await db.execute({ sql: 'INSERT INTO projects (title_en,title_ar,description_en,description_ar,status,gradient,icon,tech_stack,github_url,demo_url,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)', args: [p.title_en,p.title_ar,p.description_en,p.description_ar,p.status,p.gradient,p.icon,p.tech_stack,'#','#',p.sort_order] });
  }

  const services = [
    { name_en:'Basic', name_ar:'أساسي', price_egp:77500, description_en:'Perfect for landing pages and small business sites.', description_ar:'مثالي لصفحات الهبوط ومواقع الأعمال الصغيرة.', features_en:JSON.stringify(['Responsive Design','Up to 5 Pages','SEO Optimization','1 Month Support']), features_ar:JSON.stringify(['تصميم متجاوب','حتى 5 صفحات','تحسين SEO','شهر دعم']), is_popular:0, sort_order:1 },
    { name_en:'Professional', name_ar:'احترافي', price_egp:186000, description_en:'Full-stack web apps with admin dashboards and database design.', description_ar:'تطبيقات ويب متكاملة مع لوحات تحكم وتصميم قواعد بيانات.', features_en:JSON.stringify(['Everything in Basic','Unlimited Pages','Admin Dashboard','Database Design','3 Months Support']), features_ar:JSON.stringify(['كل مزايا الأساسي','صفحات غير محدودة','لوحة تحكم إدارية','تصميم قاعدة بيانات','3 أشهر دعم']), is_popular:1, sort_order:2 },
    { name_en:'Enterprise', name_ar:'مؤسساتي', price_egp:387500, description_en:'AI-integrated systems, mobile apps, and scalable architecture.', description_ar:'أنظمة متكاملة بالذكاء الاصطناعي وتطبيقات موبايل وهندسة قابلة للتوسع.', features_en:JSON.stringify(['Everything in Pro','AI Integration','Android App','Scalable Architecture','12 Months Support']), features_ar:JSON.stringify(['كل مزايا الاحترافي','دمج الذكاء الاصطناعي','تطبيق أندرويد','هندسة قابلة للتوسع','12 شهر دعم']), is_popular:0, sort_order:3 }
  ];
  for (const s of services) {
    await db.execute({ sql: 'INSERT INTO services (name_en,name_ar,price_egp,description_en,description_ar,features_en,features_ar,is_popular,sort_order) VALUES (?,?,?,?,?,?,?,?,?)', args: [s.name_en,s.name_ar,s.price_egp,s.description_en,s.description_ar,s.features_en,s.features_ar,s.is_popular,s.sort_order] });
  }

  console.log('Database seeded successfully!');
}

seed().catch(e => { console.error(e); process.exit(1); });
