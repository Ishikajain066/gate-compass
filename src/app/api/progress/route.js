import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { initDatabase } from '@/lib/db/init';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  try {
    const client = getDbClient();
    await initDatabase();

    const body = await request.json();
    const {
      subtopic_id,
      topic_id,
      status,
      theory_completed,
      practice_completed,
      pyq_completed,
      revision_completed,
      confidence_rating,
      notes,
      mistakes,
      next_revision_date,
    } = body;

    const targetSubtopicId = subtopic_id || topic_id;

    if (!targetSubtopicId) {
      return NextResponse.json(
        { success: false, error: 'subtopic_id or topic_id is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 1. Resolve canonical ID if this is a shared subtopic
    let canonicalTargetId = targetSubtopicId;
    const subLookup = await client.execute({
      sql: `SELECT canonical_id FROM subtopics WHERE id = ? LIMIT 1`,
      args: [targetSubtopicId],
    });

    if (subLookup.rows.length > 0 && subLookup.rows[0].canonical_id) {
      canonicalTargetId = subLookup.rows[0].canonical_id;
    }

    // 2. Fetch existing subtopic progress
    const existing = await client.execute({
      sql: `SELECT * FROM subtopic_progress WHERE subtopic_id = ?`,
      args: [canonicalTargetId],
    });

    const current = existing.rows[0] || {};

    const updatedTheory = theory_completed !== undefined ? (theory_completed ? 1 : 0) : (current.theory_completed || 0);
    const updatedPractice = practice_completed !== undefined ? (practice_completed ? 1 : 0) : (current.practice_completed || 0);
    const updatedPyq = pyq_completed !== undefined ? (pyq_completed ? 1 : 0) : (current.pyq_completed || 0);
    const updatedRevision = revision_completed !== undefined ? (revision_completed ? 1 : 0) : (current.revision_completed || 0);

    // Determine status: if explicitly provided use it, otherwise derive from checkboxes
    let updatedStatus = status;
    if (!updatedStatus) {
      if (updatedTheory && updatedPractice && updatedPyq && updatedRevision) {
        updatedStatus = 'COMPLETED';
      } else if (updatedTheory || updatedPractice || updatedPyq || updatedRevision) {
        updatedStatus = 'IN_PROGRESS';
      } else {
        updatedStatus = current.status || 'NOT_STARTED';
      }
    }

    const updatedConfidence = confidence_rating !== undefined ? Number(confidence_rating) : (current.confidence_rating || 0);
    const updatedNotes = notes !== undefined ? notes : current.notes || '';
    const updatedMistakes = mistakes !== undefined ? mistakes : current.mistakes || '';
    const updatedRevDate = next_revision_date !== undefined ? next_revision_date : current.next_revision_date || null;

    // 3. Upsert into subtopic_progress table
    await client.execute({
      sql: `
        INSERT INTO subtopic_progress (
          subtopic_id, status, theory_completed, practice_completed,
          pyq_completed, revision_completed, confidence_rating,
          notes, mistakes, next_revision_date, last_studied_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(subtopic_id) DO UPDATE SET
          status = excluded.status,
          theory_completed = excluded.theory_completed,
          practice_completed = excluded.practice_completed,
          pyq_completed = excluded.pyq_completed,
          revision_completed = excluded.revision_completed,
          confidence_rating = excluded.confidence_rating,
          notes = excluded.notes,
          mistakes = excluded.mistakes,
          next_revision_date = excluded.next_revision_date,
          last_studied_at = excluded.last_studied_at,
          updated_at = excluded.updated_at
      `,
      args: [
        canonicalTargetId,
        updatedStatus,
        updatedTheory,
        updatedPractice,
        updatedPyq,
        updatedRevision,
        updatedConfidence,
        updatedNotes,
        updatedMistakes,
        updatedRevDate,
        now,
        now,
      ],
    });

    // 4. Also upsert into revision_records if revision date specified
    if (updatedRevDate) {
      const revId = `rev-${canonicalTargetId}-${updatedRevDate}`;
      await client.execute({
        sql: `
          INSERT INTO revision_records (id, subtopic_id, scheduled_date, status, confidence_score, created_at)
          VALUES (?, ?, ?, 'SCHEDULED', ?, ?)
          ON CONFLICT(id) DO UPDATE SET scheduled_date = excluded.scheduled_date
        `,
        args: [revId, canonicalTargetId, updatedRevDate, updatedConfidence, now],
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        subtopic_id: targetSubtopicId,
        canonical_id: canonicalTargetId,
        status: updatedStatus,
        theory_completed: Boolean(updatedTheory),
        practice_completed: Boolean(updatedPractice),
        pyq_completed: Boolean(updatedPyq),
        revision_completed: Boolean(updatedRevision),
        confidence_rating: updatedConfidence,
        notes: updatedNotes,
        mistakes: updatedMistakes,
        next_revision_date: updatedRevDate,
        last_studied_at: now,
      },
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
