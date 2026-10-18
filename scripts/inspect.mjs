import { getDbClient } from '../src/lib/db/index.js';

async function inspect() {
  const client = getDbClient();
  const res = await client.execute('SELECT id, name, exam, section_number FROM subjects ORDER BY exam, section_number');
  console.log('Subjects:', res.rows);
}

inspect();
