import { getDbClient } from '../src/lib/db/index.js';

async function testSyllabusAndSync() {
  console.log('🧪 Starting Smoke Test...');
  const client = getDbClient();

  // 1. Verify subject counts
  const subjRes = await client.execute('SELECT exam, COUNT(*) as count FROM subjects GROUP BY exam');
  console.log('Subjects by Exam:');
  for (const row of subjRes.rows) {
    console.log(`  ${row.exam}: ${row.count} subjects`);
  }

  // 2. Verify subtopics count
  const subRes = await client.execute('SELECT COUNT(*) as total FROM subtopics');
  console.log(`Total Subtopics: ${subRes.rows[0].total}`);

  // 3. Verify shared mapping: cs-em-la-eigen vs da-la-eigen
  const eigenRes = await client.execute(`
    SELECT id, name, category, canonical_id FROM subtopics WHERE canonical_id = 'comm-sub-eigen'
  `);
  console.log(`Shared subtopics mapped to 'comm-sub-eigen': ${eigenRes.rows.length}`);
  eigenRes.rows.forEach(r => console.log(`  [${r.id}] ${r.name} (canonical: ${r.canonical_id})`));

  // 4. Test simulated progress toggle
  const canonicalKey = 'comm-sub-eigen';
  console.log(`Simulating marking '${canonicalKey}' as COMPLETED...`);
  await client.execute({
    sql: `
      INSERT INTO subtopic_progress (subtopic_id, status, theory_completed, practice_completed, pyq_completed, revision_completed, updated_at)
      VALUES (?, 'COMPLETED', 1, 1, 1, 1, ?)
      ON CONFLICT(subtopic_id) DO UPDATE SET status = 'COMPLETED'
    `,
    args: [canonicalKey, new Date().toISOString()]
  });

  // Query progress joined with subtopics
  const joinRes = await client.execute({
    sql: `
      SELECT s.id, s.name, sub.exam, sp.status
      FROM subtopics s
      JOIN topics t ON s.topic_id = t.id
      JOIN subjects sub ON t.subject_id = sub.id
      JOIN subtopic_progress sp ON sp.subtopic_id = COALESCE(s.canonical_id, s.id)
      WHERE s.canonical_id = 'comm-sub-eigen'
    `
  });
  console.log('Progress status of both subtopic instances:');
  joinRes.rows.forEach(r => console.log(`  ${r.exam} -> ${r.name}: ${r.status}`));

  // Reset back to clean 0 baseline
  await client.execute({
    sql: `DELETE FROM subtopic_progress WHERE subtopic_id = ?`,
    args: [canonicalKey]
  });
  console.log('✅ Cleaned up test record. Baseline preserved at 0.');
  console.log('🎉 Smoke test completed successfully!');
}

testSyllabusAndSync().catch(err => {
  console.error('❌ Smoke test failed:', err);
  process.exit(1);
});
