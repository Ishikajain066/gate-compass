import { getDbClient } from '../src/lib/db/index.js';

async function clean() {
  const client = getDbClient();
  await client.execute("DELETE FROM subjects WHERE id LIKE '%-sec%'");
  await client.execute("DELETE FROM topics WHERE id LIKE 'comm-topic-%' OR id LIKE 'cs-topic-%' OR id LIKE 'da-topic-%'");
  await client.execute("DELETE FROM subtopics WHERE id LIKE '%-sub-[0-9]%'");
  console.log('Old legacy items pruned successfully.');
}

clean();
