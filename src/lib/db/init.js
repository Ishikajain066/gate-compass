import { getDbClient } from './index.js';
import { SUBJECTS_DATA, TOPICS_DATA } from './seed-data.js';

export async function initDatabase() {
  const client = getDbClient();

  // Create tables with SQLite/Turso compatible DDL
  await client.execute(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      exam TEXT NOT NULL,
      section_number INTEGER NOT NULL,
      description TEXT
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      shared_scope TEXT NOT NULL DEFAULT 'STANDALONE',
      description TEXT,
      order_index INTEGER DEFAULT 0
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS subtopics (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      canonical_id TEXT,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );
  `);

  // Try adding canonical_id column to subtopics if table already existed from before
  try {
    await client.execute(`ALTER TABLE subtopics ADD COLUMN canonical_id TEXT;`);
  } catch (e) {
    // Column already exists, safe to ignore
  }

  // Try adding subject_id column to topics if table already existed from before
  try {
    await client.execute(`ALTER TABLE topics ADD COLUMN subject_id TEXT;`);
  } catch (e) {
    // Column already exists, safe to ignore
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS subtopic_progress (
      subtopic_id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'NOT_STARTED',
      theory_completed INTEGER DEFAULT 0,
      practice_completed INTEGER DEFAULT 0,
      pyq_completed INTEGER DEFAULT 0,
      revision_completed INTEGER DEFAULT 0,
      confidence_rating INTEGER DEFAULT 0,
      notes TEXT,
      mistakes TEXT,
      next_revision_date TEXT,
      last_studied_at TEXT,
      updated_at TEXT
    );
  `);

  // Retain legacy topic_progress for backwards compatibility
  await client.execute(`
    CREATE TABLE IF NOT EXISTS topic_progress (
      topic_id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'NOT_STARTED',
      theory_completed INTEGER DEFAULT 0,
      practice_completed INTEGER DEFAULT 0,
      pyq_completed INTEGER DEFAULT 0,
      revision_completed INTEGER DEFAULT 0,
      confidence_rating INTEGER DEFAULT 0,
      notes TEXT,
      mistakes TEXT,
      next_revision_date TEXT,
      last_studied_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      subtopic_id TEXT,
      topic_id TEXT,
      category TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      planned_minutes INTEGER DEFAULT 60,
      actual_minutes INTEGER DEFAULT 0,
      session_date TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);

  try {
    await client.execute(`ALTER TABLE study_sessions ADD COLUMN subtopic_id TEXT;`);
  } catch (e) {}

  await client.execute(`
    CREATE TABLE IF NOT EXISTS daily_plans (
      id TEXT PRIMARY KEY,
      plan_date TEXT NOT NULL,
      session_number INTEGER NOT NULL,
      activity TEXT NOT NULL,
      planned_minutes INTEGER DEFAULT 60,
      actual_minutes INTEGER DEFAULT 0,
      category TEXT NOT NULL,
      subtopic_id TEXT,
      topic_id TEXT,
      completed INTEGER DEFAULT 0,
      notes TEXT,
      updated_at TEXT
    );
  `);

  try {
    await client.execute(`ALTER TABLE daily_plans ADD COLUMN subtopic_id TEXT;`);
  } catch (e) {}

  await client.execute(`
    CREATE TABLE IF NOT EXISTS revision_records (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      completed_date TEXT,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      revision_notes TEXT,
      confidence_score INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS placement_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NOT_STARTED',
      priority TEXT DEFAULT 'Medium',
      notes TEXT,
      updated_at TEXT
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Check if topics already exist; if not or if updating to full syllabus, seed
  const countRes = await client.execute('SELECT COUNT(*) as count FROM subtopics;');
  const count = Number(countRes.rows[0].count);

  if (count < 100) {
    await seedDatabase(client);
  }
}

export async function seedDatabase(client) {
  if (!client) {
    client = getDbClient();
  }

  // 1. Insert Subjects (10 CS + 7 DA)
  for (const s of SUBJECTS_DATA) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO subjects (id, name, exam, section_number, description) VALUES (?, ?, ?, ?, ?)`,
      args: [s.id, s.name, s.exam, s.sectionNumber, s.description],
    });
  }

  // 2. Insert Topics & Subtopics
  for (const t of TOPICS_DATA) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO topics (id, subject_id, name, category, shared_scope, description, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        t.id,
        t.subjectId,
        t.name,
        t.category,
        t.sharedScope || 'STANDALONE',
        t.description || '',
        t.orderIndex,
      ],
    });

    if (t.subtopics && t.subtopics.length > 0) {
      let subIndex = 0;
      for (const sub of t.subtopics) {
        subIndex++;
        await client.execute({
          sql: `INSERT OR REPLACE INTO subtopics (id, topic_id, name, category, canonical_id, order_index) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            sub.id,
            t.id,
            sub.name,
            sub.category,
            sub.canonicalId || sub.id,
            subIndex,
          ],
        });
      }
    }
  }

  // 3. Initialize Default Settings if not set
  const today = new Date().toISOString().split('T')[0];
  const defaultSettings = [
    { key: 'daily_goal_minutes', value: '180' },
    { key: 'prep_start_date', value: today },
    { key: 'prep_total_days', value: '90' },
    { key: 'target_exam_year', value: '2027' },
  ];

  for (const setting of defaultSettings) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO user_settings (key, value) VALUES (?, ?)`,
      args: [setting.key, setting.value],
    });
  }
}
