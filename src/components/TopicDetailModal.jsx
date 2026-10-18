'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Star, Calendar, FileText, AlertCircle, Save, BookOpen, Layers } from 'lucide-react';
import { getTodayDateString } from '@/lib/utils';

export default function TopicDetailModal({ isOpen, onClose, topic, onUpdated }) {
  const [status, setStatus] = useState('NOT_STARTED');
  const [theoryCompleted, setTheoryCompleted] = useState(false);
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [pyqCompleted, setPyqCompleted] = useState(false);
  const [revisionCompleted, setRevisionCompleted] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [notes, setNotes] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [revisionDate, setRevisionDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (topic) {
      setStatus(topic.status || 'NOT_STARTED');
      setTheoryCompleted(Boolean(topic.theory_completed));
      setPracticeCompleted(Boolean(topic.practice_completed));
      setPyqCompleted(Boolean(topic.pyq_completed));
      setRevisionCompleted(Boolean(topic.revision_completed));
      setConfidence(Number(topic.confidence_rating || 0));
      setNotes(topic.notes || '');
      setMistakes(topic.mistakes || '');
      setRevisionDate(topic.next_revision_date || '');
    }
  }, [topic]);

  if (!isOpen || !topic) return null;

  const isShared = topic.category === 'COMMON';

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtopic_id: topic.id,
          topic_id: topic.id,
          status,
          theory_completed: theoryCompleted,
          practice_completed: practiceCompleted,
          pyq_completed: pyqCompleted,
          revision_completed: revisionCompleted,
          confidence_rating: confidence,
          notes,
          mistakes,
          next_revision_date: revisionDate || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new CustomEvent('study-session-updated'));
        if (onUpdated) onUpdated();
        onClose();
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden bg-white rounded-2xl shadow-elevated border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`px-2 py-0.5 text-[10px] font-semibold tracking-wide rounded-md uppercase ${
                  isShared
                    ? 'bg-purple-100 text-purple-700 border border-purple-200/60'
                    : topic.category === 'CS_ONLY'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200/60'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200/60'
                }`}
              >
                {isShared ? 'Shared (CS + DA)' : topic.category ? topic.category.replace('_', ' ') : 'Syllabus Item'}
              </span>
              {isShared && (
                <span className="text-[11px] text-purple-600 font-medium">
                  • Syncs both CS & DA
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {topic.name}
            </h3>
            {topic.parentTopicName && (
              <p className="mt-1 text-xs text-slate-500">
                Topic: <strong className="text-slate-700">{topic.parentTopicName}</strong>
                {topic.subjectName && ` • Subject: ${topic.subjectName}`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Syllabus Completion Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'NOT_STARTED', label: 'Not Started (0%)', color: 'border-slate-200 text-slate-600' },
                { val: 'IN_PROGRESS', label: 'In Progress (50%)', color: 'border-amber-300 text-amber-700 bg-amber-50/50' },
                { val: 'COMPLETED', label: 'Completed (100%)', color: 'border-emerald-300 text-emerald-700 bg-emerald-50/50' },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => setStatus(s.val)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    status === s.val
                      ? `${s.color} ring-2 ring-indigo-500/30 font-semibold shadow-xs`
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Separate Milestone Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Milestone Checklists
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'Theory Completed', checked: theoryCompleted, set: setTheoryCompleted },
                { label: 'Practice Completed', checked: practiceCompleted, set: setPracticeCompleted },
                { label: 'PYQs Completed', checked: pyqCompleted, set: setPyqCompleted },
                { label: 'Revision Completed', checked: revisionCompleted, set: setRevisionCompleted },
              ].map((m) => (
                <label
                  key={m.label}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer select-none text-xs transition-all ${
                    m.checked
                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={m.checked}
                    onChange={(e) => {
                      m.set(e.target.checked);
                      if (e.target.checked && status === 'NOT_STARTED') {
                        setStatus('IN_PROGRESS');
                      }
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Confidence Rating (1 to 5) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Confidence Rating (1 to 5 Stars)
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {confidence === 0 ? 'Not rated yet' : `${confidence} / 5`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setConfidence(star)}
                  className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= confidence
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200 hover:text-amber-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Next Revision Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Next Revision Date
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={revisionDate}
                  min={getTodayDateString()}
                  onChange={(e) => setRevisionDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
              {revisionDate && (
                <button
                  type="button"
                  onClick={() => setRevisionDate('')}
                  className="px-2 py-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Personal Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Personal Study Notes & Key Formulas
            </label>
            <textarea
              rows={3}
              placeholder="Record key formulas, theorem summaries, trick questions, or reference notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Mistakes & Weak Spots */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mistake Log & Tricky Traps
            </label>
            <textarea
              rows={2}
              placeholder="Record common silly mistakes, edge cases to watch out for in tests..."
              value={mistakes}
              onChange={(e) => setMistakes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-rose-800"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Subtopic Progress'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
