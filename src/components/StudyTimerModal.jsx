'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, X, Clock, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getTodayDateString } from '@/lib/utils';

export default function StudyTimerModal({ isOpen, onClose, initialData = null }) {
  const [activity, setActivity] = useState('Concept Learning');
  const [category, setCategory] = useState('COMMON');
  const [plannedMinutes, setPlannedMinutes] = useState(60);
  const [topicId, setTopicId] = useState('');
  const [notes, setNotes] = useState('');
  const [topicsList, setTopicsList] = useState([]);

  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef(null);

  // Load subtopics for dropdown
  useEffect(() => {
    fetch('/api/syllabus')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.subjects) {
          const list = [];
          data.subjects.forEach((sub) => {
            sub.topics?.forEach((top) => {
              top.subtopics?.forEach((s) => {
                list.push({
                  id: s.id,
                  name: s.name,
                  category: s.category,
                  subjectName: sub.name,
                  topicName: top.name,
                });
              });
            });
          });
          setTopicsList(list);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // Sync initialData if provided (e.g., launched from daily plan card)
  useEffect(() => {
    if (initialData) {
      if (initialData.activity) setActivity(initialData.activity);
      if (initialData.category) setCategory(initialData.category);
      if (initialData.planned_minutes) setPlannedMinutes(initialData.planned_minutes);
      if (initialData.topic_id) setTopicId(initialData.topic_id);
      if (initialData.notes) setNotes(initialData.notes);
      if (initialData.actual_minutes) setSecondsElapsed(initialData.actual_minutes * 60);
    }
  }, [initialData]);

  // Timer interval handling
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive]);

  if (!isOpen) return null;

  const currentMinutes = Math.floor(secondsElapsed / 60);
  const currentSeconds = secondsElapsed % 60;
  const formattedTime = `${String(currentMinutes).padStart(2, '0')}:${String(currentSeconds).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.round((currentMinutes / (plannedMinutes || 60)) * 100));

  const handleToggleTimer = () => {
    setIsActive(!isActive);
  };

  const handleResetTimer = () => {
    setIsActive(false);
    setSecondsElapsed(0);
  };

  const handleAddMinutes = (mins) => {
    setSecondsElapsed((prev) => Math.max(0, prev + mins * 60));
  };

  const handleSaveSession = async (markCompleted = true) => {
    setIsSaving(true);
    const recordedMinutes = Math.max(1, Math.round(secondsElapsed / 60));
    const today = getTodayDateString();

    try {
      const sessionNumber = initialData?.session_number || 1;
      const planId = initialData?.id || `plan-${today}-${sessionNumber}`;

      const res = await fetch('/api/daily-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: planId,
          plan_date: today,
          session_number: sessionNumber,
          activity,
          planned_minutes: plannedMinutes,
          actual_minutes: recordedMinutes,
          category,
          topic_id: topicId || null,
          completed: markCompleted ? 1 : 0,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Trigger celebratory confetti if session target reached
        if (recordedMinutes >= plannedMinutes) {
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
            });
          } catch (e) {}
        }

        // Notify other components
        window.dispatchEvent(new CustomEvent('study-session-updated'));
        setIsActive(false);
        onClose();
      }
    } catch (err) {
      console.error('Failed to save session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden bg-white rounded-2xl shadow-elevated border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-100/70 text-indigo-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">GATE Study Session Timer</h3>
              <p className="text-xs text-slate-500">Record focused study minutes without double-counting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="px-6 py-8 text-center bg-gradient-to-b from-white to-slate-50/50 border-b border-slate-100">
          <div className="relative inline-flex flex-col items-center justify-center w-52 h-52 rounded-full border-4 border-indigo-100 bg-white shadow-inner">
            <span className="text-5xl font-mono font-bold tracking-tight text-slate-900">
              {formattedTime}
            </span>
            <span className="mt-1 text-xs font-medium text-slate-500">
              Target: {plannedMinutes} mins ({progressPercent}%)
            </span>
            <div
              className="absolute bottom-4 h-1.5 bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(75, (progressPercent * 0.75))}%` }}
            />
          </div>

          {/* Quick Adjustment Controls */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => handleAddMinutes(-5)}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white rounded-md border border-slate-200 hover:bg-slate-50"
            >
              -5m
            </button>
            <button
              onClick={() => handleAddMinutes(5)}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white rounded-md border border-slate-200 hover:bg-slate-50"
            >
              +5m
            </button>
            <button
              onClick={() => handleAddMinutes(15)}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white rounded-md border border-slate-200 hover:bg-slate-50"
            >
              +15m
            </button>
          </div>

          {/* Controls: Play/Pause/Reset */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handleToggleTimer}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-white shadow-sm transition-all active:scale-95 ${
                isActive
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{secondsElapsed > 0 ? 'Resume Timer' : 'Start Timer'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetTimer}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Session Details Form */}
        <div className="p-6 space-y-4 max-h-72 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Activity
              </label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Concept Learning">Concept Learning</option>
                <option value="Practice Questions and PYQs">Practice Questions and PYQs</option>
                <option value="Revision or Another GATE Subject">Revision / Another Subject</option>
                <option value="Mock Test & Analysis">Mock Test & Analysis</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Syllabus Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="COMMON">Common to CS & DA</option>
                <option value="CS">GATE CS Only</option>
                <option value="DA">GATE DA Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Syllabus Topic (Optional)
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">-- General GATE Study --</option>
              {topicsList.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.category}] {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Session Notes / Key Learnings
            </label>
            <input
              type="text"
              placeholder="e.g. Solved 15 Eigenvalues PYQs, understood LU decomposition steps"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveSession(false)}
              className="px-3.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Save Progress
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveSession(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Complete & Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
