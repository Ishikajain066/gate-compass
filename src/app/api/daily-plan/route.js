import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { initDatabase } from '@/lib/db/init';
import { getTodayDateString } from '@/lib/utils';

export async function GET(request) {
  try {
    const client = getDbClient();
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getTodayDateString();

    let plansRes = await client.execute({
      sql: `SELECT * FROM daily_plans WHERE plan_date = ? ORDER BY session_number ASC`,
      args: [date],
    });

    // If no plan exists for this date, seed the 3 default sessions totaling 180 min
    if (plansRes.rows.length === 0) {
      const defaultSessions = [
        {
          id: `plan-${date}-1`,
          planDate: date,
          sessionNumber: 1,
          activity: 'Concept Learning',
          plannedMinutes: 60,
          actualMinutes: 0,
          category: 'COMMON',
          completed: 0,
          notes: '',
        },
        {
          id: `plan-${date}-2`,
          planDate: date,
          sessionNumber: 2,
          activity: 'Practice Questions and PYQs',
          plannedMinutes: 60,
          actualMinutes: 0,
          category: 'COMMON',
          completed: 0,
          notes: '',
        },
        {
          id: `plan-${date}-3`,
          planDate: date,
          sessionNumber: 3,
          activity: 'Revision or Another GATE Subject',
          plannedMinutes: 60,
          actualMinutes: 0,
          category: 'CS',
          completed: 0,
          notes: '',
        },
      ];

      for (const s of defaultSessions) {
        await client.execute({
          sql: `
            INSERT INTO daily_plans (id, plan_date, session_number, activity, planned_minutes, actual_minutes, category, completed, notes, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            s.id,
            s.planDate,
            s.sessionNumber,
            s.activity,
            s.plannedMinutes,
            s.actualMinutes,
            s.category,
            s.completed,
            s.notes,
            new Date().toISOString(),
          ],
        });
      }

      plansRes = await client.execute({
        sql: `SELECT * FROM daily_plans WHERE plan_date = ? ORDER BY session_number ASC`,
        args: [date],
      });
    }

    // Fetch user settings for daily target
    const settingsRes = await client.execute({
      sql: `SELECT value FROM user_settings WHERE key = 'daily_goal_minutes'`,
    });
    const dailyGoalMinutes = Number(settingsRes.rows[0]?.value || 180);

    const sessions = plansRes.rows.map((row) => ({
      ...row,
      completed: Boolean(row.completed),
    }));

    const totalActualMinutes = sessions.reduce((sum, s) => sum + (s.actual_minutes || 0), 0);
    const totalPlannedMinutes = sessions.reduce((sum, s) => sum + (s.planned_minutes || 0), 0);

    return NextResponse.json({
      success: true,
      date,
      dailyGoalMinutes,
      totalActualMinutes,
      totalPlannedMinutes,
      remainingMinutes: Math.max(0, dailyGoalMinutes - totalActualMinutes),
      sessions,
    });
  } catch (error) {
    console.error('Error fetching daily plan:', error);
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
    const {
      id,
      plan_date,
      session_number,
      activity,
      planned_minutes,
      actual_minutes,
      category,
      topic_id,
      completed,
      notes,
    } = body;

    const now = new Date().toISOString();
    const planId = id || `plan-${plan_date}-${session_number}`;

    await client.execute({
      sql: `
        INSERT INTO daily_plans (
          id, plan_date, session_number, activity, planned_minutes,
          actual_minutes, category, topic_id, completed, notes, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          activity = excluded.activity,
          planned_minutes = excluded.planned_minutes,
          actual_minutes = excluded.actual_minutes,
          category = excluded.category,
          topic_id = excluded.topic_id,
          completed = excluded.completed,
          notes = excluded.notes,
          updated_at = excluded.updated_at
      `,
      args: [
        planId,
        plan_date,
        session_number,
        activity,
        Number(planned_minutes || 60),
        Number(actual_minutes || 0),
        category || 'COMMON',
        topic_id || null,
        completed ? 1 : 0,
        notes || '',
        now,
      ],
    });

    // Synchronize study_sessions table with this single session (Single canonical source, anti-double-counting)
    const sessionId = `sess-${planId}`;
    if (Number(actual_minutes || 0) > 0 || completed) {
      await client.execute({
        sql: `
          INSERT INTO study_sessions (
            id, topic_id, category, activity_type, planned_minutes,
            actual_minutes, session_date, completed, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            topic_id = excluded.topic_id,
            category = excluded.category,
            activity_type = excluded.activity_type,
            planned_minutes = excluded.planned_minutes,
            actual_minutes = excluded.actual_minutes,
            completed = excluded.completed,
            notes = excluded.notes
        `,
        args: [
          sessionId,
          topic_id || null,
          category || 'COMMON',
          activity,
          Number(planned_minutes || 60),
          Number(actual_minutes || 0),
          plan_date,
          completed ? 1 : 0,
          notes || '',
          now,
        ],
      });

      // If topic_id is provided and actual study took place, update topic last_studied_at
      if (topic_id) {
        await client.execute({
          sql: `
            INSERT INTO topic_progress (topic_id, status, last_studied_at, updated_at)
            VALUES (?, 'IN_PROGRESS', ?, ?)
            ON CONFLICT(topic_id) DO UPDATE SET
              last_studied_at = excluded.last_studied_at,
              status = CASE WHEN status = 'NOT_STARTED' THEN 'IN_PROGRESS' ELSE status END,
              updated_at = excluded.updated_at
          `,
          args: [topic_id, now, now],
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Daily plan session updated successfully',
    });
  } catch (error) {
    console.error('Error updating daily plan:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
