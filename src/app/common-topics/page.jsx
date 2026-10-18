'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  Sparkles,
  Check,
  Edit3,
} from 'lucide-react';
import TopicDetailModal from '@/components/TopicDetailModal';

export default function CommonTopicsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCommonData();
  }, []);

  const fetchCommonData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/syllabus');
      const data = await res.json();
      if (data.success) {
        setSubjects(data.subjects || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
        await fetchCommonData();
        window.dispatchEvent(new CustomEvent('study-session-updated'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Group overlapping domains between CS and DA
  const domains = [
    {
      id: 'domain-la',
      title: 'Linear Algebra',
      csSubjectName: 'CS Section 1: Engineering Mathematics',
      daSubjectName: 'DA Section 2: Linear Algebra',
      csTopicIds: ['cs-em-lin-alg'],
      daTopicIds: ['da-la-matrices-types', 'da-la-systems-decompositions'],
      daExtTopicIds: ['da-la-vector-spaces', 'da-la-matrices-types'],
      description: 'Matrix theory, determinants, linear systems, eigenvalues/eigenvectors, and LU decomposition are 100% shared.',
    },
    {
      id: 'domain-calc',
      title: 'Calculus and Optimization',
      csSubjectName: 'CS Section 1: Engineering Mathematics',
      daSubjectName: 'DA Section 3: Calculus and Optimization',
      csTopicIds: ['cs-em-calculus'],
      daTopicIds: ['da-co-single-var-taylor', 'da-co-optimization'],
      daExtTopicIds: ['da-co-single-var-taylor', 'da-co-optimization'],
      description: 'Single-variable functions, limits, continuity, differentiability, and extrema are shared. CS adds Integration/MVT; DA adds Taylor Series/Optimization.',
    },
    {
      id: 'domain-prob',
      title: 'Probability and Statistics',
      csSubjectName: 'CS Section 1: Engineering Mathematics',
      daSubjectName: 'DA Section 1: Probability and Statistics',
      csTopicIds: ['cs-em-prob-stat'],
      daTopicIds: ['da-ps-counting-axioms', 'da-ps-expectation-descriptive', 'da-ps-pmf-pdf-distributions'],
      daExtTopicIds: ['da-ps-clt-inference', 'da-ps-pmf-pdf-distributions'],
      description: 'Probability axioms, Bayes theorem, standard distributions, mean, median, mode, and variance are shared. DA covers advanced CLT, continuous PDF/CDF, and hypothesis testing.',
    },
    {
      id: 'domain-ds',
      title: 'Data Structures',
      csSubjectName: 'CS Section 4: Programming and Data Structures',
      daSubjectName: 'DA Section 4: Programming, Data Structures & Algorithms',
      csTopicIds: ['cs-pds-linear-ds', 'cs-pds-non-linear-ds'],
      daTopicIds: ['da-pdsa-data-structures'],
      daExtTopicIds: ['da-pdsa-python'],
      description: 'Stacks, queues, linked lists, trees, and graph representations are shared core data structures.',
    },
    {
      id: 'domain-algo',
      title: 'Algorithms',
      csSubjectName: 'CS Section 5: Algorithms',
      daSubjectName: 'DA Section 4: Programming, Data Structures & Algorithms',
      csTopicIds: ['cs-algo-search-sort-hash', 'cs-algo-graph-algorithms'],
      daTopicIds: ['da-pdsa-search-sort-graphs'],
      daExtTopicIds: ['cs-algo-design-techniques', 'cs-algo-complexity'],
      description: 'Linear search, binary search, elementary sorting, mergesort, quicksort, BFS/DFS, and Dijkstra are shared.',
    },
    {
      id: 'domain-dbms',
      title: 'Databases & Relational Model',
      csSubjectName: 'CS Section 9: Databases',
      daSubjectName: 'DA Section 5: Database Management and Warehousing',
      csTopicIds: ['cs-dbms-models', 'cs-dbms-sql-normalization', 'cs-dbms-indexing-transactions'],
      daTopicIds: ['da-dbw-relational'],
      daExtTopicIds: ['da-dbw-preprocessing-warehousing', 'cs-dbms-indexing-transactions'],
      description: 'ER-model, relational algebra, tuple calculus, SQL, integrity constraints, normal forms (1NF-BCNF), and file indexing are shared.',
    },
    {
      id: 'domain-logic',
      title: 'Logic (Propositional & Predicate)',
      csSubjectName: 'CS Section 1: Engineering Mathematics',
      daSubjectName: 'DA Section 7: Artificial Intelligence',
      csTopicIds: ['cs-em-discrete'],
      daTopicIds: ['da-ai-logic-reasoning'],
      daExtTopicIds: ['da-ai-search', 'cs-em-discrete'],
      description: 'Propositional and first-order predicate logic are tested in CS Discrete Mathematics and DA Artificial Intelligence.',
    },
  ];

  // Flatten all subtopics from subjects
  const allSubtopics = [];
  subjects.forEach((s) => {
    s.topics?.forEach((t) => {
      t.subtopics?.forEach((sub) => {
        allSubtopics.push({
          ...sub,
          parentTopicName: t.name,
          parentTopicId: t.id,
          subjectName: s.name,
          subjectId: s.id,
          exam: s.exam,
        });
      });
    });
  });

  // Calculate distinct common subtopics progress
  const distinctCommonMap = new Map();
  allSubtopics.forEach((sub) => {
    if (sub.category === 'COMMON') {
      const key = sub.canonical_id || sub.id;
      if (!distinctCommonMap.has(key)) {
        distinctCommonMap.set(key, sub);
      }
    }
  });

  const distinctCommonList = Array.from(distinctCommonMap.values());
  const totalCommonCount = distinctCommonList.length;
  let completedCommonCount = 0;
  distinctCommonList.forEach((s) => {
    if (s.status === 'COMPLETED') completedCommonCount++;
  });
  const commonPercentage = totalCommonCount > 0 ? Math.round((completedCommonCount / totalCommonCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Dual Exam Synergy</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Common Topics — Shared CS + DA Material
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Study once, advance both examinations. Real-time synchronized subtopic completion.
          </p>
        </div>

        {/* Coverage Banner */}
        <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200/60 flex items-center gap-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">
              Shared Core Progress
            </span>
            <div className="text-2xl font-bold text-purple-900">
              {commonPercentage}%
            </div>
            <div className="text-[11px] text-purple-600 mt-0.5">
              {completedCommonCount} of {totalCommonCount} shared subtopics completed
            </div>
          </div>
          <div className="w-24 h-2 bg-purple-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-700"
              style={{ width: `${commonPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Official Disclaimer Alert */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Syllabus Coverage vs Marks Weightage:</strong> This percentage represents actual overlapping syllabus items defined in the official IIT Madras CS & DA syllabuses. It does <em>not</em> represent official exam marks weightage.
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter shared material (e.g. Eigenvalues, Bayes Theorem, Dijkstra, Normal Forms)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
        />
      </div>

      {/* Side-by-Side Domain Tables */}
      <div className="space-y-6">
        {domains.map((domain) => {
          // Find shared subtopics belonging to this domain
          const sharedSubs = allSubtopics.filter((s) => {
            if (s.category !== 'COMMON') return false;
            const inCs = domain.csTopicIds.includes(s.parentTopicId);
            const inDa = domain.daTopicIds.includes(s.parentTopicId);
            return inCs || inDa;
          });

          // Distinct shared canonical subtopics for this domain
          const distinctDomainShared = [];
          const seen = new Set();
          sharedSubs.forEach((s) => {
            const key = s.canonical_id || s.id;
            if (!seen.has(key)) {
              seen.add(key);
              distinctDomainShared.push(s);
            }
          });

          // CS-only extensions in this domain
          const csExtSubs = allSubtopics.filter(
            (s) => s.exam === 'CS' && s.category === 'CS_ONLY' && domain.csTopicIds.includes(s.parentTopicId)
          );

          // DA-only extensions in this domain
          const daExtSubs = allSubtopics.filter(
            (s) => s.exam === 'DA' && s.category === 'DA_ONLY' && domain.daExtTopicIds.includes(s.parentTopicId)
          );

          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesDomain = domain.title.toLowerCase().includes(q);
            const matchesShared = distinctDomainShared.some((s) => s.name.toLowerCase().includes(q));
            const matchesCs = csExtSubs.some((s) => s.name.toLowerCase().includes(q));
            const matchesDa = daExtSubs.some((s) => s.name.toLowerCase().includes(q));
            if (!matchesDomain && !matchesShared && !matchesCs && !matchesDa) return null;
          }

          return (
            <div
              key={domain.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle card-hover transition-all"
            >
              {/* Domain Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {domain.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-blue-700">{domain.csSubjectName}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-700">{domain.daSubjectName}</span>
                  </div>
                </div>
                <span className="text-[11px] text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full font-semibold self-start sm:self-center">
                  {distinctDomainShared.length} Shared Core Subtopics
                </span>
              </div>

              {/* 3 Columns Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
                {/* 1. Shared Core Subtopics (Checkboxes Sync Both CS & DA) */}
                <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Shared Material (Syncs Both)</span>
                  </div>

                  <div className="space-y-2">
                    {distinctDomainShared.map((sub) => {
                      const isDone = sub.status === 'COMPLETED';

                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-purple-100/80 text-xs shadow-2xs"
                        >
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleSubtopic(sub)}
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                                isDone
                                  ? 'bg-purple-600 border-purple-600 text-white'
                                  : 'border-slate-300 hover:border-purple-500 bg-white'
                              }`}
                            >
                              {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                            <span
                              className={`truncate ${
                                isDone ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                              }`}
                            >
                              {sub.name}
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubtopic(sub);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-purple-700"
                            title="Edit notes & details"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {distinctDomainShared.length === 0 && (
                      <div className="text-xs text-slate-400 italic">None</div>
                    )}
                  </div>
                </div>

                {/* 2. CS-Specific Material */}
                <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100">
                  <div className="text-xs font-bold text-blue-900 mb-3">
                    CS-Specific Extensions (Updates CS Only)
                  </div>

                  <div className="space-y-2">
                    {csExtSubs.map((sub) => {
                      const isDone = sub.status === 'COMPLETED';

                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-blue-100/80 text-xs shadow-2xs"
                        >
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleSubtopic(sub)}
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                                isDone
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-slate-300 hover:border-blue-500 bg-white'
                              }`}
                            >
                              {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                            <span
                              className={`truncate ${
                                isDone ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                              }`}
                            >
                              {sub.name}
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubtopic(sub);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-700"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {csExtSubs.length === 0 && (
                      <div className="text-xs text-slate-400 italic">
                        CS covers the standard shared subset for this domain
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. DA-Specific Material */}
                <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100">
                  <div className="text-xs font-bold text-emerald-900 mb-3">
                    DA-Specific Extensions (Updates DA Only)
                  </div>

                  <div className="space-y-2">
                    {daExtSubs.map((sub) => {
                      const isDone = sub.status === 'COMPLETED';

                      return (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-emerald-100/80 text-xs shadow-2xs"
                        >
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleToggleSubtopic(sub)}
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                                isDone
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 hover:border-emerald-500 bg-white'
                              }`}
                            >
                              {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                            <span
                              className={`truncate ${
                                isDone ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                              }`}
                            >
                              {sub.name}
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubtopic(sub);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-700"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {daExtSubs.length === 0 && (
                      <div className="text-xs text-slate-400 italic">
                        DA covers the standard shared subset for this domain
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Explanatory Note */}
              <div className="mt-4 text-[11px] text-slate-500 italic">
                💡 {domain.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtopic Modal */}
      <TopicDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        topic={selectedSubtopic}
        onUpdated={fetchCommonData}
      />
    </div>
  );
}
