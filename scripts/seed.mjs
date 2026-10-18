import { initDatabase, seedDatabase } from '../src/lib/db/init.js';

async function main() {
  console.log('🚀 Initializing GATE COMPASS database with complete syllabus...');
  try {
    await initDatabase();
    await seedDatabase();
    console.log('✅ Database initialized & GATE 2027 CS + DA full detailed syllabuses seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed database:', err);
    process.exit(1);
  }
}

main();
