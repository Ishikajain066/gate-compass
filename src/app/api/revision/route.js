import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { initDatabase } from '@/lib/db/init';
import { getTodayDateString } from '@/lib/utils';

export async function GET() {
  try {
    const client = getDbClient();
    await initDatabase();
    const today = getTodayDateString();

    const result = await client.execute({
      sql: `
        SELECT r.*, 
               COALESCE(s.name, t.name, 'Unknown') as topic_name, 
               COALESCE(s.category, t.category, 'COMMON') as topic_category
        FROM revision_records r
        LEFT JOIN subtopics s ON r.topic_id = s.id
        LEFT JOIN topics t ON r.topic_id = t.id
        ORDER BY r.scheduled_date ASC
      `,
    });

    const overdue = [];
    const upcoming = [];
    const completed = [];

    for (const row of result.rows) {
      if (row.status === 'COMPLETED') {
        completed.push(row);
      } else if (row.scheduled_date < today) {
        overdue.push({ ...row, status: 'OVERDUE' });
      } else {
        upcoming.push(row);
      }
    }

    return NextResponse.json({
      success: true,
      overdue,
      upcoming,
      completed,
    });
  } catch (error) {
    console.error('Error fetching revisions:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const client = getDbClient();
    await initDatabase();

    const body = await request.json();
    const { topic_id, scheduled_date, revision_notes } = body;

    if (!topic_id || !scheduled_date) {
      return NextResponse.json(
        { success: false, error: 'topic_id and scheduled_date are required' },
        { status: 400 }
      );
    }

    const id = `rev-${topic_id}-${scheduled_date}-${Date.now()}`;
    const now = new Date().toISOString();

    await client.execute({
      sql: `
        INSERT INTO revision_records (id, topic_id, scheduled_date, status, revision_notes, created_at)
        VALUES (?, ?, ?, 'SCHEDULED', ?, ?)
      `,
      args: [id, topic_id, scheduled_date, revision_notes || '', now],
    });

    // Check if subtopic or topic
    const subCheck = await client.execute({
      sql: `SELECT id, canonical_id FROM subtopics WHERE id = ?`,
      args: [topic_id],
    });

    if (subCheck.rows.length > 0) {
      const canonicalKey = subCheck.rows[0].canonical_id || subCheck.rows[0].id;
      await client.execute({
        sql: `
          INSERT INTO subtopic_progress (subtopic_id, next_revision_date, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(subtopic_id) DO UPDATE SET
            next_revision_date = excluded.next_revision_date,
            updated_at = excluded.updated_at
        `,
        args: [canonicalKey, scheduled_date, now],
      });
    } else {
      await client.execute({
        sql: `
          INSERT INTO topic_progress (topic_id, next_revision_date, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(topic_id) DO UPDATE SET
            next_revision_date = excluded.next_revision_date,
            updated_at = excluded.updated_at
        `,
        args: [topic_id, scheduled_date, now],
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Revision scheduled successfully',
    });
  } catch (error) {
    console.error('Error scheduling revision:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const client = getDbClient();
    await initDatabase();

    const body = await request.json();
    const { id, completed_date, confidence_score, revision_notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Revision ID is required' },
        { status: 400 }
      );
    }

    const completedDate = completed_date || getTodayDateString();

    await client.execute({
      sql: `
        UPDATE revision_records
        SET status = 'COMPLETED',
            completed_date = ?,
            confidence_score = ?,
            revision_notes = COALESCE(?, revision_notes)
        WHERE id = ?
      `,
      args: [completedDate, Number(confidence_score || 5), revision_notes, id],
    });

    // Mark revision_completed in topic_progress
    const revRow = await client.execute({
      sql: `SELECT topic_id FROM revision_records WHERE id = ?`,
      args: [id],
    });

    if (revRow.rows.length > 0) {
      const topicId = revRow.rows[0].topic_id;
      const now = new Date().toISOString();
      const scoreNum = Number(confidence_score || 0);

      // Check if subtopic
      const subCheck = await client.execute({
        sql: `SELECT id, canonical_id FROM subtopics WHERE id = ?`,
        args: [topicId],
      });

      if (subCheck.rows.length > 0) {
        const canonicalKey = subCheck.rows[0].canonical_id || subCheck.rows[0].id;
        await client.execute({
          sql: `
            INSERT INTO subtopic_progress (subtopic_id, revision_completed, confidence_rating, updated_at)
            VALUES (?, 1, ?, ?)
            ON CONFLICT(subtopic_id) DO UPDATE SET
              revision_completed = 1,
              confidence_rating = CASE WHEN ? > 0 THEN ? ELSE confidence_rating END,
              updated_at = excluded.updated_at
          `,
          args: [canonicalKey, scoreNum, now, scoreNum, scoreNum],
        });
      } else {
        await client.execute({
          sql: `
            UPDATE topic_progress
            SET revision_completed = 1,
                confidence_rating = CASE WHEN ? > 0 THEN ? ELSE confidence_rating END,
                updated_at = ?
            WHERE topic_id = ?
          `,
          args: [scoreNum, scoreNum, now, topicId],
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Revision marked as completed',
    });
  } catch (error) {
    console.error('Error completing revision:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
