import { getDbClient } from '../src/lib/db/index.js';

async function verify() {
  const client = getDbClient();
  const csSubs = await client.execute("SELECT COUNT(*) as c FROM subjects WHERE exam = 'CS'");
  const daSubs = await client.execute("SELECT COUNT(*) as c FROM subjects WHERE exam = 'DA'");
  const totalTopics = await client.execute("SELECT COUNT(*) as c FROM topics");
  const totalSubtopics = await client.execute("SELECT COUNT(*) as c FROM subtopics");
  const csSubtopics = await client.execute("SELECT COUNT(s.id) as c FROM subtopics s JOIN topics t ON s.topic_id = t.id JOIN subjects sub ON t.subject_id = sub.id WHERE sub.exam = 'CS'");
  const daSubtopics = await client.execute("SELECT COUNT(s.id) as c FROM subtopics s JOIN topics t ON s.topic_id = t.id JOIN subjects sub ON t.subject_id = sub.id WHERE sub.exam = 'DA'");
  const commonEntries = await client.execute("SELECT COUNT(*) as c FROM subtopics WHERE category = 'COMMON'");
  const distinctCanonical = await client.execute("SELECT COUNT(DISTINCT canonical_id) as c FROM subtopics WHERE category = 'COMMON'");

  console.log({
    csSubjects: Number(csSubs.rows[0].c),
    daSubjects: Number(daSubs.rows[0].c),
    totalTopics: Number(totalTopics.rows[0].c),
    totalSubtopics: Number(totalSubtopics.rows[0].c),
    csSubtopicsCount: Number(csSubtopics.rows[0].c),
    daSubtopicsCount: Number(daSubtopics.rows[0].c),
    sharedSubtopicsEntries: Number(commonEntries.rows[0].c),
    distinctSharedCanonicalMappings: Number(distinctCanonical.rows[0].c),
  });
}

verify();
