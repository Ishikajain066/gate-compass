import { createClient } from '@libsql/client';

const client = createClient({ url: 'file:gate_compass.db' });
const res = await client.execute('PRAGMA table_info(revision_records)');
console.log('revision_records columns:', res.rows.map(r => r.name));
