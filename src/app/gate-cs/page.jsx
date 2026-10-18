'use client';

import React, { useState, useEffect } from 'react';
import {
  Binary,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Star,
  ChevronDown,
  ChevronUp,
  Layers,
  Edit3,
  Check,
} from 'lucide-react';
import TopicDetailModal from '@/components/TopicDetailModal';

export default function GateCSPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL, SHARED, CS_ONLY
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCSData();
  }, []);

  const fetchCSData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/syllabus');
      const data = await res.json();
      if (data.success) {
        setSubjects((data.subjects || []).filter((s) => s.exam === 'CS'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all = {};
    subjects.forEach((s) => {
      all[s.id] = true;
    });
    setExpandedSections(all);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  // Toggle subtopic completion
  const handleToggleSubtopic = async (subtopic) => {
    const nextStatus = subtopic.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    const isCompleted = nextStatus === 'COMPLETED';

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtopic_id: subtopic.id,
          status: nextStatus,
          theory_completed: isCompleted ? 1 : 0,
          practice_completed: isCompleted ? 1 : 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchCSData();
        window.dispatchEvent(new CustomEvent('study-session-updated'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick milestone toggle
  const handleToggleMilestone = async (subtopic, field, currentValue) => {
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtopic_id: subtopic.id,
          [field]: !currentValue,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchCSData();
        window.dispatchEvent(new CustomEvent('study-session-updated'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // CS overall calculations across all atomic subtopics
  let totalCSSubtopics = 0;
  let completedCSSubtopics = 0;
  let inProgressCSSubtopics = 0;

  subjects.forEach((s) => {
    totalCSSubtopics += s.total_subtopics || 0;
    completedCSSubtopics += s.completed_subtopics || 0;
    inProgressCSSubtopics += s.in_progress_subtopics || 0;
  });

  const csScore = (completedCSSubtopics * 100) + (inProgressCSSubtopics * 50);
  const csOverallProgress = totalCSSubtopics > 0 ? Math.round(csScore / totalCSSubtopics) : 0;

  // Filter subjects and nested topics/subtopics
  const filteredSubjects = subjects
    .map((sub) => {
      const filteredTopics = (sub.topics || [])
        .map((topic) => {
          const filteredSubs = (topic.subtopics || []).filter((s) => {
            if (filterType === 'SHARED' && s.category !== 'COMMON') return false;
            if (filterType === 'CS_ONLY' && s.category !== 'CS_ONLY') return false;

            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              return (
                s.name.toLowerCase().includes(q) ||
                topic.name.toLowerCase().includes(q) ||
                sub.name.toLowerCase().includes(q)
              );
            }
            return true;
          });

          return {
            ...topic,
            subtopics: filteredSubs,
          };
        })
        .filter((topic) => topic.subtopics.length > 0);

      return {
        ...sub,
        topics: filteredTopics,
      };
    })
    .filter((sub) => sub.topics.length > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
            <Binary className="w-3.5 h-3.5" />
            <span>GATE 2027 Syllabus</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Computer Science & Information Technology (CS)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Official 10-Section Syllabus with atomic subtopic completion tracking.
          </p>
        </div>

        {/* Overall Progress Badge */}
        <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/60 flex items-center gap-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              GATE CS Progress
            </span>
            <div className="text-2xl font-bold text-blue-900">
              {csOverallProgress}%
            </div>
            <div className="text-[11px] text-blue-600 mt-0.5">
              {completedCSSubtopics} of {totalCSSubtopics} subtopics completed
            </div>
          </div>
          <div className="w-24 h-2 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-700"
              style={{ width: `${csOverallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search CS topics and subtopics (e.g. Cache Mapping, Turing Machines, Normal Forms)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="ALL">All CS Material</option>
          <option value="SHARED">Shared (CS + DA) Only</option>
          <option value="CS_ONLY">CS Exclusive Only</option>
        </select>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={expandAll}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* 10 CS Subjects Cards */}
      <div className="space-y-4">
        {filteredSubjects.map((sec) => {
          const isExpanded = expandedSections[sec.id] || Boolean(searchQuery);

          return (
            <div
              key={sec.id}
              className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-subtle transition-all"
            >
              {/* Subject Header Card */}
              <div
                onClick={() => toggleSection(sec.id)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-blue-50/40 to-white hover:bg-blue-50/60 cursor-pointer border-b border-slate-100 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-bold text-xs flex-shrink-0">
                    S{sec.section_number}
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Section {sec.section_number}: {sec.name}
                    </h2>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {sec.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5 self-end sm:self-center">
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs font-bold text-slate-900">{sec.progress_percent}%</span>
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${sec.progress_percent}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      <strong className="text-emerald-700 font-semibold">{sec.completed_subtopics}</strong> done •{' '}
                      <strong className="text-amber-700 font-semibold">{sec.in_progress_subtopics}</strong> in prog •{' '}
                      {sec.not_started_subtopics} remaining
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Nested Topics & Subtopics */}
              {isExpanded && (
                <div className="divide-y divide-slate-100 bg-white">
                  {sec.topics.map((topic) => (
                    <div key={topic.id} className="p-4 sm:p-5">
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <h3 className="text-sm font-bold text-slate-800">{topic.name}</h3>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                              topic.category === 'COMMON'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {topic.category === 'COMMON' ? 'Shared with DA' : 'CS Exclusive'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {topic.completed_subtopics} / {topic.total_subtopics} completed
                        </span>
                      </div>

                      <div className="space-y-2 pl-2 sm:pl-4">
                        {topic.subtopics.map((subtopic) => {
                          const isDone = subtopic.status === 'COMPLETED';
                          const isShared = subtopic.category === 'COMMON';

                          return (
                            <div
                              key={subtopic.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                                isDone
                                  ? 'bg-emerald-50/30 border-emerald-200/70'
                                  : 'bg-white border-slate-200/70 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSubtopic(subtopic)}
                                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                                    isDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 hover:border-blue-500 bg-white'
                                  }`}
                                >
                                  {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>

                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h4
                                      className={`text-xs font-semibold ${
                                        isDone ? 'line-through text-slate-400' : 'text-slate-900'
                                      }`}
                                    >
                                      {subtopic.name}
                                    </h4>

                                    {isShared && (
                                      <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-purple-100 text-purple-700 rounded-md">
                                        Shared
                                      </span>
                                    )}

                                    {subtopic.confidence_rating > 0 && (
                                      <div className="flex items-center text-[10px] text-amber-600 gap-0.5">
                                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                        <span>{subtopic.confidence_rating}/5</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                                <div className="flex items-center gap-1">
                                  {[
                                    { key: 'theory_completed', label: 'T', checked: subtopic.theory_completed },
                                    { key: 'practice_completed', label: 'P', checked: subtopic.practice_completed },
                                    { key: 'pyq_completed', label: 'PYQ', checked: subtopic.pyq_completed },
                                    { key: 'revision_completed', label: 'R', checked: subtopic.revision_completed },
                                  ].map((m) => (
                                    <button
                                      key={m.key}
                                      type="button"
                                      onClick={() => handleToggleMilestone(subtopic, m.key, m.checked)}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                        m.checked
                                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                                      }`}
                                    >
                                      {m.label}
                                    </button>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSubtopic({
                                      ...subtopic,
                                      parentTopicName: topic.name,
                                      subjectName: sec.name,
                                    });
                                    setIsModalOpen(true);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Details</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Subtopic Modal */}
      <TopicDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        topic={selectedSubtopic}
        onUpdated={fetchCSData}
      />
    </div>
  );
}
