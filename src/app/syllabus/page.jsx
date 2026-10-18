'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Circle,
  Star,
  Edit3,
  BookOpen,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Binary,
  Brain,
  Check,
} from 'lucide-react';
import TopicDetailModal from '@/components/TopicDetailModal';

export default function SyllabusPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [examFilter, setExamFilter] = useState('ALL'); // ALL, CS, DA, COMMON
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, NOT_STARTED, IN_PROGRESS, COMPLETED

  // Expanded subjects state (map of subject id -> boolean)
  const [expandedSubjects, setExpandedSubjects] = useState({});

  // Selected subtopic for modal
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/syllabus');
      const data = await res.json();
      if (data.success) {
        setSubjects(data.subjects || []);
      }
    } catch (e) {
      console.error('Failed to load syllabus:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (id) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all = {};
    subjects.forEach((s) => {
      all[s.id] = true;
    });
    setExpandedSubjects(all);
  };

  const collapseAll = () => {
    setExpandedSubjects({});
  };

  // Quick subtopic checkbox toggle
  const handleToggleSubtopicComplete = async (subtopic, currentStatus) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
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
        await fetchSyllabus();
        window.dispatchEvent(new CustomEvent('study-session-updated'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick milestone toggle (theory, practice, pyq, revision)
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
        await fetchSyllabus();
        window.dispatchEvent(new CustomEvent('study-session-updated'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter subjects and nested topics/subtopics
  const filteredSubjects = subjects
    .filter((sub) => {
      if (examFilter === 'CS') return sub.exam === 'CS';
      if (examFilter === 'DA') return sub.exam === 'DA';
      return true;
    })
    .map((sub) => {
      // Filter topics and their subtopics
      const filteredTopics = sub.topics
        .map((topic) => {
          const filteredSubs = topic.subtopics.filter((s) => {
            // Exam/Common filter
            if (examFilter === 'COMMON' && s.category !== 'COMMON') return false;

            // Status filter
            if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;

            // Search query
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              const matchesSub = s.name.toLowerCase().includes(q);
              const matchesTopic = topic.name.toLowerCase().includes(q);
              const matchesSubject = sub.name.toLowerCase().includes(q);
              return matchesSub || matchesTopic || matchesSubject;
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

  // Overall Global Counts
  let totalSubtopicsCount = 0;
  let completedSubtopicsCount = 0;
  let inProgressSubtopicsCount = 0;
  let notStartedSubtopicsCount = 0;

  subjects.forEach((s) => {
    s.topics?.forEach((t) => {
      t.subtopics?.forEach((sub) => {
        totalSubtopicsCount++;
        if (sub.status === 'COMPLETED') completedSubtopicsCount++;
        else if (sub.status === 'IN_PROGRESS') inProgressSubtopicsCount++;
        else notStartedSubtopicsCount++;
      });
    });
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Official GATE 2027 Syllabus</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Complete Detailed Syllabus Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Exam &rarr; Subject &rarr; Topic &rarr; Subtopic with individual milestone checklists, notes, and confidence ratings.
          </p>
        </div>

        {/* Global Progress Counts */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-xs">
            Total: {totalSubtopicsCount} Subtopics
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
            Done: {completedSubtopicsCount}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">
            In Progress: {inProgressSubtopicsCount}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-600">
            Not Started: {notStartedSubtopicsCount}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3">
        {/* Exam Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'ALL', label: 'All Subjects (17)', icon: BookOpen },
              { key: 'CS', label: 'GATE CS (10 Subjects)', icon: Binary },
              { key: 'DA', label: 'GATE DA (7 Subjects)', icon: Brain },
              { key: 'COMMON', label: 'Shared Core (CS + DA)', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setExamFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    examFilter === tab.key
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              Expand All
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by topic, subtopic (e.g. LU Decomposition, Pipelining, SVD)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started (0%)</option>
            <option value="IN_PROGRESS">In Progress (50%)</option>
            <option value="COMPLETED">Completed (100%)</option>
          </select>
        </div>
      </div>

      {/* Expandable Subject Accordions */}
      <div className="space-y-4">
        {filteredSubjects.map((sub) => {
          const isExpanded = expandedSubjects[sub.id] || Boolean(searchQuery);

          return (
            <div
              key={sub.id}
              className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-subtle transition-all"
            >
              {/* Subject Accordion Header Card */}
              <div
                onClick={() => toggleSubject(sub.id)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-50/70 to-white hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span
                    className={`flex items-center justify-center w-9 h-9 rounded-xl font-bold text-xs flex-shrink-0 ${
                      sub.exam === 'CS'
                        ? 'bg-blue-100/80 text-blue-800'
                        : 'bg-emerald-100/80 text-emerald-800'
                    }`}
                  >
                    {sub.exam === 'CS' ? `CS${sub.section_number}` : `DA${sub.section_number}`}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                          sub.exam === 'CS' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        GATE {sub.exam}
                      </span>
                      <span className="text-xs text-slate-400">
                        Section {sub.section_number}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      {sub.name}
                    </h2>
                    {sub.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {sub.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject Metrics and Expand Toggle */}
                <div className="flex items-center gap-5 self-end sm:self-center">
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs font-bold text-slate-900">
                        {sub.progress_percent}%
                      </span>
                      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            sub.exam === 'CS' ? 'bg-blue-600' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${sub.progress_percent}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      <strong className="text-emerald-700 font-semibold">{sub.completed_subtopics}</strong> done •{' '}
                      <strong className="text-amber-700 font-semibold">{sub.in_progress_subtopics}</strong> in prog •{' '}
                      {sub.remaining_subtopics ?? sub.not_started_subtopics} remaining
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nested Topics & Subtopics List */}
              {isExpanded && (
                <div className="divide-y divide-slate-100 bg-white">
                  {sub.topics.map((topic) => (
                    <div key={topic.id} className="p-4 sm:p-5">
                      {/* Topic Header */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <h3 className="text-sm font-bold text-slate-800">
                            {topic.name}
                          </h3>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                              topic.category === 'COMMON'
                                ? 'bg-purple-100 text-purple-700'
                                : topic.category === 'CS_ONLY'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {topic.category === 'COMMON' ? 'Shared (CS + DA)' : topic.category.replace('_', ' ')}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400">
                          {topic.completed_subtopics} / {topic.total_subtopics} completed
                        </span>
                      </div>

                      {/* Subtopics List */}
                      <div className="space-y-2.5 pl-2 sm:pl-4">
                        {topic.subtopics.map((subtopic) => {
                          const isDone = subtopic.status === 'COMPLETED';
                          const isInProgress = subtopic.status === 'IN_PROGRESS';
                          const isShared = subtopic.category === 'COMMON';

                          return (
                            <div
                              key={subtopic.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                                isDone
                                  ? 'bg-emerald-50/30 border-emerald-200/70'
                                  : isInProgress
                                  ? 'bg-amber-50/20 border-amber-200/70'
                                  : 'bg-white border-slate-200/70 hover:border-slate-300'
                              }`}
                            >
                              {/* Left: Checkbox + Subtopic Name */}
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSubtopicComplete(subtopic, subtopic.status)}
                                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                                    isDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 hover:border-indigo-500 bg-white'
                                  }`}
                                  title={isDone ? 'Mark Not Started' : 'Mark Completed'}
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

                                  {subtopic.notes && (
                                    <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                                      "{subtopic.notes}"
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Right: Milestone Checkboxes + Notes Button */}
                              <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                                {/* 4 Milestones */}
                                <div className="flex items-center gap-1">
                                  {[
                                    { key: 'theory_completed', label: 'T', title: 'Theory', checked: subtopic.theory_completed },
                                    { key: 'practice_completed', label: 'P', title: 'Practice', checked: subtopic.practice_completed },
                                    { key: 'pyq_completed', label: 'PYQ', title: 'Previous Year Questions', checked: subtopic.pyq_completed },
                                    { key: 'revision_completed', label: 'R', title: 'Revision', checked: subtopic.revision_completed },
                                  ].map((m) => (
                                    <button
                                      key={m.key}
                                      type="button"
                                      onClick={() => handleToggleMilestone(subtopic, m.key, m.checked)}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                        m.checked
                                          ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
                                      }`}
                                      title={`Toggle ${m.title}`}
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
                                      subjectName: sub.name,
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

        {filteredSubjects.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            No subjects or topics match the selected search or filter criteria.
          </div>
        )}
      </div>

      {/* Subtopic Detail Modal */}
      <TopicDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        topic={selectedSubtopic}
        onUpdated={fetchSyllabus}
      />
    </div>
  );
}
