import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { seedDatabase } from '@/lib/db/init';

export async function POST(request) {
  try {
    const client = getDbClient();
    const body = await request.json().catch(() => ({}));
    const { resetProgress } = body;

    if (resetProgress) {
      await client.execute(`DELETE FROM subtopic_progress;`);
      await client.execute(`DELETE FROM topic_progress;`);
      await client.execute(`DELETE FROM study_sessions;`);
      await client.execute(`DELETE FROM daily_plans;`);
      await client.execute(`DELETE FROM revision_records;`);
    }

    await seedDatabase(client);

    return NextResponse.json({
      success: true,
      message: resetProgress
        ? 'Database reset and re-seeded with GATE 2027 CS & DA syllabuses successfully!'
        : 'Syllabus topics synchronized successfully!',
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
