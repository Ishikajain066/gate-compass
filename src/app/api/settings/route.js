import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { initDatabase } from '@/lib/db/init';

export async function GET() {
  try {
    const client = getDbClient();
    await initDatabase();

    const result = await client.execute(`SELECT * FROM user_settings`);
    const settings = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
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
    const { daily_goal_minutes, prep_start_date, prep_total_days } = body;

    if (daily_goal_minutes !== undefined) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('daily_goal_minutes', ?)`,
        args: [String(daily_goal_minutes)],
      });
    }

    if (prep_start_date !== undefined) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('prep_start_date', ?)`,
        args: [String(prep_start_date)],
      });
    }

    if (prep_total_days !== undefined) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('prep_total_days', ?)`,
        args: [String(prep_total_days)],
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
