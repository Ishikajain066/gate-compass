'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  Play,
  CheckCircle2,
  Calendar,
  Save,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { formatMinutes, getTodayDateString } from '@/lib/utils';
import StudyTimerModal from '@/components/StudyTimerModal';

export default function DailyPlanPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Topics for selection
  const [topicsList, setTopicsList] = useState([]);

  // Active study timer modal
  const [activeTimerSession, setActiveTimerSession] = useState(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  useEffect(() => {
    fetchPlanForDate(selectedDate);
    fetch('/api/syllabus')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.subjects) {
          const list = [];
          d.subjects.forEach((sub) => {
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
          setTopicsList(list);
        } else if (d.topics) {
          setTopicsList(d.topics || []);
        }
      })
      .catch((e) => console.error(e));

    const handleSessionUpdated = () => fetchPlanForDate(selectedDate);
    window.addEventListener('study-session-updated', handleSessionUpdated);
    return () => window.removeEventListener('study-session-updated', handleSessionUpdated);
  }, [selectedDate]);

  const fetchPlanForDate = async (dateStr) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/daily-plan?date=${dateStr}`);
      const data = await res.json();
      if (data.success) {
        setPlanData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionFieldChange = (idx, field, value) => {
    if (!planData || !planData.sessions) return;
    const updatedSessions = [...planData.sessions];
    updatedSessions[idx] = {
      ...updatedSessions[idx],
      [field]: value,
    };
    setPlanData({
      ...planData,
      sessions: updatedSessions,
    });
  };

  const handleSaveSession = async (session) => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.id,
          plan_date: selectedDate,
          session_number: session.session_number,
          activity: session.activity,
          planned_minutes: Number(session.planned_minutes || 60),
          actual_minutes: Number(session.actual_minutes || 0),
          category: session.category,
          topic_id: session.topic_id || null,
          completed: session.completed ? 1 : 0,
          notes: session.notes || '',
        }),
      });

      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new CustomEvent('study-session-updated'));
        await fetchPlanForDate(selectedDate);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaunchTimer = (session) => {
    setActiveTimerSession(session);
    setIsTimerOpen(true);
  };

  const changeDateBy = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const sessions = planData?.sessions || [];
  const dailyGoalMinutes = planData?.dailyGoalMinutes || 180;
  const totalActualMinutes = sessions.reduce((sum, s) => sum + (Number(s.actual_minutes) || 0), 0);
  const totalPlannedMinutes = sessions.reduce((sum, s) => sum + (Number(s.planned_minutes) || 0), 0);
  const remainingMinutes = Math.max(0, dailyGoalMinutes - totalActualMinutes);
  const progressPercent = Math.min(100, Math.round((totalActualMinutes / dailyGoalMinutes) * 100));

  const isToday = selectedDate === getTodayDateString();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>3-Hour Daily GATE Target</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daily Study Plan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Three 60-minute focused blocks (180m total). Configurable, timer-integrated, anti-double-counted.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs">
          <button
            onClick={() => changeDateBy(-1)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{selectedDate}</span>
            {isToday && (
              <span className="px-1.5 py-0.5 text-[10px] bg-indigo-100 text-indigo-700 rounded-md">
                Today
              </span>
            )}
          </div>

          <button
            onClick={() => changeDateBy(1)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayDateString())}
              className="text-xs text-indigo-600 hover:underline px-2"
            >
              Reset to Today
            </button>
          )}
        </div>
      </div>

      {/* Daily Progress Gauge Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                GATE Study Target
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatMinutes(totalActualMinutes)}{' '}
                <span className="text-sm font-normal text-slate-400">
                  / {formatMinutes(dailyGoalMinutes)} target
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">
              {totalActualMinutes >= dailyGoalMinutes ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-4 h-4" />
                  Daily Target Achieved!
                </span>
              ) : (
                <span>{formatMinutes(remainingMinutes)} remaining for today</span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {progressPercent}% completed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3 Configurable Sessions Cards */}
      <div className="space-y-4">
        {sessions.map((session, idx) => {
          const isDone = session.completed;

          return (
            <div
              key={session.id || idx}
              className={`p-6 rounded-xl border bg-white shadow-subtle transition-all ${
                isDone ? 'border-emerald-200/90' : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                {/* Session Title & Badge */}
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    S{session.session_number || idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-medium">
                        Session {session.session_number || idx + 1}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                          session.category === 'COMMON'
                            ? 'bg-purple-100 text-purple-700'
                            : session.category === 'CS'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {session.category}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {session.activity}
                    </h3>
                  </div>
                </div>

                {/* Right controls: Launch Timer or Mark Done */}
                <div className="flex items-center gap-2.5 self-end lg:self-center">
                  <button
                    onClick={() => handleLaunchTimer(session)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Timer</span>
                  </button>

                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(session.completed)}
                      onChange={(e) => {
                        handleSessionFieldChange(idx, 'completed', e.target.checked);
                        if (e.target.checked && (!session.actual_minutes || session.actual_minutes === 0)) {
                          handleSessionFieldChange(idx, 'actual_minutes', session.planned_minutes || 60);
                        }
                      }}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span>Completed</span>
                  </label>
                </div>
              </div>

              {/* Editable Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {/* Activity Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    value={session.activity}
                    onChange={(e) => handleSessionFieldChange(idx, 'activity', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Category Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exam Track
                  </label>
                  <select
                    value={session.category}
                    onChange={(e) => handleSessionFieldChange(idx, 'category', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="COMMON">Common (CS + DA)</option>
                    <option value="CS">GATE CS</option>
                    <option value="DA">GATE DA</option>
                  </select>
                </div>

                {/* Planned Minutes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Planned Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={session.planned_minutes || 60}
                    onChange={(e) => handleSessionFieldChange(idx, 'planned_minutes', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Actual Logged Minutes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Actual Minutes Studied
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={session.actual_minutes || 0}
                    onChange={(e) => handleSessionFieldChange(idx, 'actual_minutes', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-indigo-700"
                  />
                </div>
              </div>

              {/* Topic Link & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link Syllabus Topic (Optional)
                  </label>
                  <select
                    value={session.topic_id || ''}
                    onChange={(e) => handleSessionFieldChange(idx, 'topic_id', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">-- General Study Session --</option>
                    {topicsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.category}] {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Session Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Completed lecture 3, solved 10 PYQs"
                    value={session.notes || ''}
                    onChange={(e) => handleSessionFieldChange(idx, 'notes', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Save Session Button */}
              <div className="flex justify-end mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveSession(session)}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Session Changes</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timer Modal */}
      <StudyTimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        initialData={activeTimerSession}
      />
    </div>
  );
}
