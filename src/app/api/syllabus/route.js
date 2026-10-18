import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { initDatabase } from '@/lib/db/init';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const client = getDbClient();
    await initDatabase();

    // 1. Fetch Subjects
    const subjectsRes = await client.execute(`
      SELECT * FROM subjects ORDER BY exam ASC, section_number ASC
    `);

    // 2. Fetch Topics
    const topicsRes = await client.execute(`
      SELECT * FROM topics ORDER BY order_index ASC
    `);

    // 3. Fetch Subtopics joined with subtopic_progress using canonical_id
    const subtopicsRes = await client.execute(`
      SELECT s.*,
             COALESCE(sp.status, 'NOT_STARTED') as status,
             COALESCE(sp.theory_completed, 0) as theory_completed,
             COALESCE(sp.practice_completed, 0) as practice_completed,
             COALESCE(sp.pyq_completed, 0) as pyq_completed,
             COALESCE(sp.revision_completed, 0) as revision_completed,
             COALESCE(sp.confidence_rating, 0) as confidence_rating,
             sp.notes,
             sp.mistakes,
             sp.next_revision_date,
             sp.last_studied_at
      FROM subtopics s
      LEFT JOIN subtopic_progress sp 
        ON sp.subtopic_id = COALESCE(s.canonical_id, s.id)
      ORDER BY s.order_index ASC
    `);

    // Map subtopics by topic_id
    const subtopicsByTopic = {};
    for (const sub of subtopicsRes.rows) {
      if (!subtopicsByTopic[sub.topic_id]) {
        subtopicsByTopic[sub.topic_id] = [];
      }
      subtopicsByTopic[sub.topic_id].push({
        ...sub,
        theory_completed: Boolean(sub.theory_completed),
        practice_completed: Boolean(sub.practice_completed),
        pyq_completed: Boolean(sub.pyq_completed),
        revision_completed: Boolean(sub.revision_completed),
        confidence_rating: Number(sub.confidence_rating || 0),
      });
    }

    // Attach subtopics to topics, and calculate topic-level metrics
    const topicsBySubject = {};
    const topics = topicsRes.rows.map((t) => {
      const topicSubs = subtopicsByTopic[t.id] || [];
      const totalSubs = topicSubs.length;
      let completedSubs = 0;
      let inProgressSubs = 0;

      for (const s of topicSubs) {
        if (s.status === 'COMPLETED') completedSubs++;
        else if (s.status === 'IN_PROGRESS') inProgressSubs++;
      }

      const notStartedSubs = totalSubs - (completedSubs + inProgressSubs);
      const score = (completedSubs * 100) + (inProgressSubs * 50);
      const progressPercent = totalSubs > 0 ? Math.round(score / totalSubs) : 0;

      const topicObj = {
        ...t,
        subtopics: topicSubs,
        total_subtopics: totalSubs,
        completed_subtopics: completedSubs,
        in_progress_subtopics: inProgressSubs,
        not_started_subtopics: notStartedSubs,
        progress_percent: progressPercent,
      };

      if (!topicsBySubject[t.subject_id]) {
        topicsBySubject[t.subject_id] = [];
      }
      topicsBySubject[t.subject_id].push(topicObj);

      return topicObj;
    });

    // Attach topics to subjects, and calculate subject-level atomic progress
    const subjects = subjectsRes.rows.map((sub) => {
      const subTopics = topicsBySubject[sub.id] || [];
      let totalSubtopics = 0;
      let completedSubtopics = 0;
      let inProgressSubtopics = 0;

      for (const top of subTopics) {
        totalSubtopics += top.total_subtopics;
        completedSubtopics += top.completed_subtopics;
        inProgressSubtopics += top.in_progress_subtopics;
      }

      const notStartedSubtopics = totalSubtopics - (completedSubtopics + inProgressSubtopics);
      const subjectScore = (completedSubtopics * 100) + (inProgressSubtopics * 50);
      const subjectProgress = totalSubtopics > 0 ? Math.round(subjectScore / totalSubtopics) : 0;

      return {
        ...sub,
        topics: subTopics,
        total_subtopics: totalSubtopics,
        completed_subtopics: completedSubtopics,
        in_progress_subtopics: inProgressSubtopics,
        not_started_subtopics: notStartedSubtopics,
        progress_percent: subjectProgress,
      };
    });

    return NextResponse.json({
      success: true,
      subjects,
      topics,
      total_subjects: subjects.length,
      total_topics: topics.length,
      total_subtopics: subtopicsRes.rows.length,
    });
  } catch (error) {
    console.error('Error fetching syllabus:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
