'use client';

import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Star,
  Search,
  Filter,
  FileText,
} from 'lucide-react';
import { getTodayDateString } from '@/lib/utils';

export default function RevisionCenterPage() {
  const [revisions, setRevisions] = useState({ overdue: [], upcoming: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);

  // Category filter: ALL, COMMON, CS_ONLY, DA_ONLY
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleTopicId, setScheduleTopicId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(getTodayDateString());
  const [scheduleNotes, setScheduleNotes] = useState('');

  // Complete revision modal state
  const [completingRecord, setCompletingRecord] = useState(null);
  const [completeScore, setCompleteScore] = useState(5);
  const [completeNotes, setCompleteNotes] = useState('');

  useEffect(() => {
    fetchRevisions();
    fetch('/api/syllabus')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.subjects) {
            const list = [];
            data.subjects.forEach((sub) => {
              sub.topics?.forEach((top) => {
                top.subtopics?.forEach((s) => {
                  list.push({
                    id: s.id,
                    name: `${sub.name} > ${s.name}`,
                    category: s.category,
                  });
                });
              });
            });
            setTopics(list);
            if (list.length > 0) {
              setScheduleTopicId(list[0].id);
            }
          } else if (data.topics) {
            setTopics(data.topics || []);
            if (data.topics && data.topics.length > 0) {
              setScheduleTopicId(data.topics[0].id);
            }
          }
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/revision');
      const data = await res.json();
      if (data.success) {
        setRevisions({
          overdue: data.overdue || [],
          upcoming: data.upcoming || [],
          completed: data.completed || [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleTopicId || !scheduleDate) return;

    try {
      const res = await fetch('/api/revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: scheduleTopicId,
          scheduled_date: scheduleDate,
          revision_notes: scheduleNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsScheduleOpen(false);
        setScheduleNotes('');
        await fetchRevisions();
        window.dispatchEvent(new CustomEvent('study-session-updated'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completingRecord) return;

    try {
      const res = await fetch('/api/revision', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: completingRecord.id,
          completed_date: getTodayDateString(),
          confidence_score: completeScore,
          revision_notes: completeNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCompletingRecord(null);
        await fetchRevisions();
        window.dispatchEvent(new CustomEvent('study-session-updated'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filterByCategory = (list) => {
    if (categoryFilter === 'ALL') return list;
    return list.filter((r) => r.topic_category === categoryFilter);
  };

  const overdueList = filterByCategory(revisions.overdue);
  const upcomingList = filterByCategory(revisions.upcoming);
  const completedList = filterByCategory(revisions.completed);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Spaced Repetition</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Revision Center
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Keep formulas, derivations, and tricky PYQs fresh with timely scheduled revisions.
          </p>
        </div>

        <button
          onClick={() => setIsScheduleOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all active:scale-95 self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Revision</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Track:
        </span>
        {[
          { key: 'ALL', label: 'All Subjects' },
          { key: 'COMMON', label: 'Shared (CS + DA)' },
          { key: 'CS_ONLY', label: 'CS Only' },
          { key: 'DA_ONLY', label: 'DA Only' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategoryFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              categoryFilter === tab.key
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3 Revision Columns/Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Overdue Revisions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-rose-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h2 className="text-sm font-bold text-slate-900">
                Overdue Revisions ({overdueList.length})
              </h2>
            </div>
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              Attention Needed
            </span>
          </div>

          <div className="space-y-3">
            {overdueList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/20 shadow-xs card-hover"
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                      item.topic_category === 'COMMON'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.topic_category}
                  </span>
                  <span className="text-xs font-semibold text-rose-600">
                    Due: {item.scheduled_date}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900">
                  {item.topic_name}
                </h3>
                {item.revision_notes && (
                  <p className="mt-1 text-xs text-slate-500 italic">
                    "{item.revision_notes}"
                  </p>
                )}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      setCompletingRecord(item);
                      setCompleteNotes(item.revision_notes || '');
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete</span>
                  </button>
                </div>
              </div>
            ))}

            {overdueList.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                No overdue revisions. Great job staying on track!
              </div>
            )}
          </div>
        </div>

        {/* 2. Upcoming Revisions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-900">
                Upcoming Revisions ({upcomingList.length})
              </h2>
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Scheduled
            </span>
          </div>

          <div className="space-y-3">
            {upcomingList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs card-hover"
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                      item.topic_category === 'COMMON'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.topic_category}
                  </span>
                  <span className="text-xs font-semibold text-indigo-600">
                    {item.scheduled_date}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900">
                  {item.topic_name}
                </h3>
                {item.revision_notes && (
                  <p className="mt-1 text-xs text-slate-500 italic">
                    "{item.revision_notes}"
                  </p>
                )}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      setCompletingRecord(item);
                      setCompleteNotes(item.revision_notes || '');
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete</span>
                  </button>
                </div>
              </div>
            ))}

            {upcomingList.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                No upcoming revisions scheduled. Use the button above to schedule your next revision!
              </div>
            )}
          </div>
        </div>

        {/* 3. Completed Revisions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900">
                Previously Revised ({completedList.length})
              </h2>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Completed
            </span>
          </div>

          <div className="space-y-3">
            {completedList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 shadow-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-slate-400">
                    Completed: {item.completed_date || 'Earlier'}
                  </span>
                  {item.confidence_score > 0 && (
                    <div className="flex items-center text-[10px] text-amber-600 gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{item.confidence_score}/5</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xs font-bold text-slate-800">
                  {item.topic_name}
                </h3>
                {item.revision_notes && (
                  <p className="mt-1 text-xs text-slate-500">
                    "{item.revision_notes}"
                  </p>
                )}
              </div>
            ))}

            {completedList.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                No completed revisions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Revision Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-elevated border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Schedule Revision</h3>
              <p className="text-xs text-slate-500">Choose a syllabus topic and set a target date</p>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Topic
                </label>
                <select
                  value={scheduleTopicId}
                  onChange={(e) => setScheduleTopicId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.category}] {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  min={getTodayDateString()}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Revision Goal / Focus Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Re-derive formulas, solve 10 tricky PYQs"
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Revision Modal */}
      {completingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-elevated border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Mark Revision Complete</h3>
              <p className="text-xs text-slate-500">{completingRecord.topic_name}</p>
            </div>
            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Confidence Score After Revision (1 to 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCompleteScore(star)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= completeScore
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-slate-700 ml-2">
                    {completeScore} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Post-Revision Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared all doubts in eigenvalues and LU decomposition"
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompletingRecord(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Confirm Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
