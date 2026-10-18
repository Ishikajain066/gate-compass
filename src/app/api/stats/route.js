import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { initDatabase } from '@/lib/db/init';
import { getTodayDateString, calculateDayProgress } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const client = getDbClient();
    await initDatabase();

    const today = getTodayDateString();

    // 1. Fetch User Settings
    const settingsRes = await client.execute(`SELECT * FROM user_settings`);
    const settings = {};
    for (const row of settingsRes.rows) {
      settings[row.key] = row.value;
    }

    const startDate = settings.prep_start_date || today;
    const totalDays = Number(settings.prep_total_days || 90);
    const dailyGoalMinutes = Number(settings.daily_goal_minutes || 180);

    const { currentDay, remainingDays } = calculateDayProgress(startDate, totalDays);

    // 2. Fetch all subtopics joined with subtopic_progress and their parent subject/exam
    const subtopicsRes = await client.execute(`
      SELECT s.id, s.name, s.category, s.canonical_id,
             sub.exam as subject_exam, sub.name as subject_name, sub.id as subject_id,
             COALESCE(sp.status, 'NOT_STARTED') as status,
             COALESCE(sp.confidence_rating, 0) as confidence_rating,
             sp.last_studied_at, sp.next_revision_date
      FROM subtopics s
      JOIN topics t ON s.topic_id = t.id
      JOIN subjects sub ON t.subject_id = sub.id
      LEFT JOIN subtopic_progress sp ON sp.subtopic_id = COALESCE(s.canonical_id, s.id)
      ORDER BY sub.exam ASC, sub.section_number ASC, s.order_index ASC
    `);

    let csTotal = 0;
    let csScore = 0;
    let daTotal = 0;
    let daScore = 0;

    // Distinct common canonical subtopics to prevent double counting in common stats
    const commonSeen = new Set();
    let commonTotal = 0;
    let commonScore = 0;

    let completedSubtopicsCount = 0;
    let inProgressSubtopicsCount = 0;
    let notStartedSubtopicsCount = 0;

    const weakSubtopics = [];

    // Distinct tracking across entire prep to avoid double counting shared subtopics in total count
    const uniqueSubtopicsSeen = new Set();
    let totalUniqueSubtopics = 0;

    for (const sub of subtopicsRes.rows) {
      const canonicalKey = sub.canonical_id || sub.id;
      const status = sub.status;
      let score = 0;
      if (status === 'COMPLETED') score = 100;
      else if (status === 'IN_PROGRESS') score = 50;

      // Track unique global subtopics
      if (!uniqueSubtopicsSeen.has(canonicalKey)) {
        uniqueSubtopicsSeen.add(canonicalKey);
        totalUniqueSubtopics++;
        if (status === 'COMPLETED') completedSubtopicsCount++;
        else if (status === 'IN_PROGRESS') inProgressSubtopicsCount++;
        else notStartedSubtopicsCount++;

        if (sub.confidence_rating > 0 && sub.confidence_rating <= 2) {
          weakSubtopics.push({
            id: sub.id,
            canonical_id: sub.canonical_id,
            name: sub.name,
            subject_name: sub.subject_name,
            category: sub.category,
            confidence: sub.confidence_rating,
          });
        }
      }

      // CS Progress Calculation
      if (sub.subject_exam === 'CS') {
        csTotal++;
        csScore += score;
      }

      // DA Progress Calculation
      if (sub.subject_exam === 'DA') {
        daTotal++;
        daScore += score;
      }

      // Common Progress Calculation
      if (sub.category === 'COMMON' && !commonSeen.has(canonicalKey)) {
        commonSeen.add(canonicalKey);
        commonTotal++;
        commonScore += score;
      }
    }

    const csProgress = csTotal > 0 ? Math.round(csScore / csTotal) : 0;
    const daProgress = daTotal > 0 ? Math.round(daScore / daTotal) : 0;
    const commonProgress = commonTotal > 0 ? Math.round(commonScore / commonTotal) : 0;

    // 3. Study Time (Anti-double-counting strictly preserved: summed once from study_sessions)
    const todaySessionsRes = await client.execute({
      sql: `SELECT SUM(actual_minutes) as total FROM study_sessions WHERE session_date = ?`,
      args: [today],
    });
    const todayStudyMinutes = Number(todaySessionsRes.rows[0]?.total || 0);

    const past7Res = await client.execute({
      sql: `SELECT SUM(actual_minutes) as total FROM study_sessions WHERE date(session_date) >= date(?, '-6 days')`,
      args: [today],
    });
    const weekStudyMinutes = Number(past7Res.rows[0]?.total || 0);

    const past30Res = await client.execute({
      sql: `SELECT SUM(actual_minutes) as total FROM study_sessions WHERE date(session_date) >= date(?, '-29 days')`,
      args: [today],
    });
    const monthStudyMinutes = Number(past30Res.rows[0]?.total || 0);

    // 4. Daily study trend
    const trendRes = await client.execute({
      sql: `
        SELECT session_date, SUM(actual_minutes) as minutes
        FROM study_sessions
        WHERE date(session_date) >= date(?, '-13 days')
        GROUP BY session_date
        ORDER BY session_date ASC
      `,
      args: [today],
    });

    const trendMap = {};
    for (const row of trendRes.rows) {
      trendMap[row.session_date] = Number(row.minutes || 0);
    }

    const studyHistory = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      studyHistory.push({
        date: dateStr,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        minutes: trendMap[dateStr] || 0,
        goal: dailyGoalMinutes,
      });
    }

    // 5. Recently studied subtopics
    const recentSubtopicsRes = await client.execute(`
      SELECT s.id, s.name, s.category, sub.name as subject_name, sp.status, sp.confidence_rating, sp.last_studied_at
      FROM subtopic_progress sp
      JOIN subtopics s ON (s.canonical_id = sp.subtopic_id OR s.id = sp.subtopic_id)
      JOIN topics t ON s.topic_id = t.id
      JOIN subjects sub ON t.subject_id = sub.id
      WHERE sp.last_studied_at IS NOT NULL
      GROUP BY sp.subtopic_id
      ORDER BY sp.last_studied_at DESC
      LIMIT 6
    `);

    // 6. Revisions Due
    const revisionDueRes = await client.execute({
      sql: `
        SELECT r.id, r.topic_id, r.scheduled_date, r.confidence_score,
               COALESCE(s.name, t.name, 'Topic') as topic_name,
               COALESCE(s.category, t.category, 'COMMON') as category
        FROM revision_records r
        LEFT JOIN subtopics s ON (s.canonical_id = r.topic_id OR s.id = r.topic_id)
        LEFT JOIN topics t ON r.topic_id = t.id
        WHERE r.status = 'SCHEDULED' AND date(r.scheduled_date) <= date(?)
        GROUP BY r.id
        ORDER BY r.scheduled_date ASC
        LIMIT 6
      `,
      args: [today],
    });

    return NextResponse.json({
      success: true,
      countdown: {
        currentDay,
        totalDays,
        remainingDays,
        dailyGoalMinutes,
        todayStudyMinutes,
        startDate,
      },
      progress: {
        csProgress,
        daProgress,
        commonProgress,
        csTotalSubtopics: csTotal,
        daTotalSubtopics: daTotal,
        commonTotalSubtopics: commonTotal,
        totalUniqueSubtopics,
        completedSubtopicsCount,
        inProgressSubtopicsCount,
        notStartedSubtopicsCount,
      },
      studyTime: {
        todayMinutes: todayStudyMinutes,
        weekMinutes: weekStudyMinutes,
        monthMinutes: monthStudyMinutes,
        dailyGoalMinutes,
      },
      studyHistory,
      recentTopics: recentSubtopicsRes.rows,
      revisionsDue: revisionDueRes.rows,
      weakTopics: weakSubtopics,
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
