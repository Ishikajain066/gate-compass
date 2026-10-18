'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Flame,
  ArrowRight,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { formatMinutes, getTodayDateString, calculateDayProgress } from '@/lib/utils';

export default function CalendarPage() {
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [daySessionsMap, setDaySessionsMap] = useState({});
  const [selectedDayIndex, setSelectedDayIndex] = useState(1);
  const [activePhaseTab, setActivePhaseTab] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const [statsRes, settRes, syllabusRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/settings'),
        fetch('/api/syllabus'),
      ]);

      const [statsData, settData] = await Promise.all([
        statsRes.json(),
        settRes.json(),
      ]);

      if (statsData.success) {
        setStats(statsData);
      }
      if (settData.success) {
        setSettings(settData.settings);
      }

      // Fetch study sessions to map actual study minutes by date
      const sessRes = await fetch('/api/daily-plan');
      const sessData = await sessRes.json();
      if (sessData.success) {
        // Will fetch history from statsData.studyHistory
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startDateStr = settings?.prep_start_date || stats?.countdown?.startDate || getTodayDateString();
  const totalDays = Number(settings?.prep_total_days || 90);
  const { currentDay } = calculateDayProgress(startDateStr, totalDays);

  // Set default selected day to current day on first load
  useEffect(() => {
    if (currentDay) {
      setSelectedDayIndex(currentDay);
      if (currentDay <= 30) setActivePhaseTab(1);
      else if (currentDay <= 60) setActivePhaseTab(2);
      else setActivePhaseTab(3);
    }
  }, [currentDay]);

  // Build the 90 calendar day items
  const calendarDays = [];
  const startObj = new Date(startDateStr);
  const todayStr = getTodayDateString();

  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(startObj);
    d.setDate(startObj.getDate() + (i - 1));
    const dateStr = d.toISOString().split('T')[0];

    let phase = 1;
    if (i > 60) phase = 3;
    else if (i > 30) phase = 2;

    const isToday = dateStr === todayStr || i === currentDay;
    const isPast = i < currentDay;
    const isFuture = i > currentDay;

    // Check if user logged minutes from stats study history
    const historyItem = stats?.studyHistory?.find((h) => h.date === dateStr);
    const loggedMinutes = historyItem ? historyItem.minutes : 0;

    calendarDays.push({
      dayNumber: i,
      dateStr,
      displayDate: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
      phase,
      isToday,
      isPast,
      isFuture,
      loggedMinutes,
      status: isPast
        ? loggedMinutes > 0
          ? 'COMPLETED'
          : 'MISSED'
        : isToday
        ? 'TODAY'
        : 'UPCOMING',
    });
  }

  const selectedDayInfo = calendarDays[selectedDayIndex - 1] || calendarDays[0];

  // 3-Phase Roadmap Definitions
  const phaseData = {
    1: {
      title: 'PHASE 1: Days 1–30',
      subtitle: 'Foundations & High-Yield Shared Core',
      description:
        'Focus on mastering shared topics common to both CS and DA: Linear Algebra, Calculus, Probability, Basic Data Structures, Core Algorithms, and Relational DBMS.',
      keyGoals: [
        'Linear Algebra: Matrices, determinants, eigenvalues, LU decomposition',
        'Calculus: Functions, limits, continuity, maxima/minima',
        'Probability: Axioms, conditional probability, Bayes theorem, standard distributions',
        'Data Structures & Algorithms: Stacks, queues, linked lists, trees, binary search, mergesort, quicksort',
        'Databases: ER model, relational algebra, SQL, normal forms',
      ],
      strategy: 'Spend 2 hours on concept clarity and 1 hour on foundational problem solving per day.',
    },
    2: {
      title: 'PHASE 2: Days 31–60',
      subtitle: 'Exam-Specific Deep Dive & PYQ Mastery',
      description:
        'Continue shared applications while branching into exclusive sections: Digital Logic, Computer Architecture, TOC, Compiler, OS, Networks for CS; and Advanced Vector Spaces, SVD, Machine Learning, AI Search for DA.',
      keyGoals: [
        'GATE CS: Digital Logic circuits, Computer Architecture pipelining, TOC Automata & Turing machines',
        'GATE CS: Operating Systems synchronization & virtual memory, Computer Networks protocols',
        'GATE DA: Machine Learning supervised & unsupervised algorithms, bias-variance, cross-validation',
        'GATE DA: Advanced probability & hypothesis testing (z/t/chi-squared), AI informed search & sampling',
        'Topic-wise 10-year GATE Previous Year Questions (PYQs) practice',
      ],
      strategy: 'Maintain 60m concept learning, 60m intensive PYQ solving, 60m revision or cross-discipline study.',
    },
    3: {
      title: 'PHASE 3: Days 61–90',
      subtitle: 'Revision, Mock Tests & Weak Spot Consolidation',
      description:
        'Consolidate all knowledge through timed mock tests, formula revisions, analysis of weak areas (confidence <= 2), and speed optimization.',
      keyGoals: [
        'Weekly full-length timed mock examinations for both CS and DA',
        'Rigorous post-test analysis and error notebook review',
        'Spaced repetition formula drill for Engineering Mathematics and ML algorithms',
        'Targeted remediation of topics with confidence rating under 3 stars',
        'Virtual calculator speed and accuracy drills',
      ],
      strategy: 'Shift focus to 90m practice under timed exam conditions, 60m test analysis, 30m rapid revision.',
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>90-Day Dual GATE Blueprint</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Study Calendar & 90-Day Plan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Structured in 3 phases. Track your daily milestones without fabricated past records.
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Current Day:</span>
          <span className="text-sm font-bold text-indigo-700">
            Day {currentDay} of {totalDays}
          </span>
        </div>
      </div>

      {/* Phase Roadmap Tabs */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          {[1, 2, 3].map((pNum) => (
            <button
              key={pNum}
              onClick={() => setActivePhaseTab(pNum)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activePhaseTab === pNum
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Phase {pNum} (Days {pNum === 1 ? '1–30' : pNum === 2 ? '31–60' : '61–90'})
            </button>
          ))}
        </div>

        {/* Phase Details Card */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {phaseData[activePhaseTab].title}: {phaseData[activePhaseTab].subtitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {phaseData[activePhaseTab].description}
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full self-start sm:self-center">
              3 Hours / Day Target
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 mt-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Key Recommended Milestones:
            </span>
            <ul className="text-xs text-slate-700 space-y-1.5">
              {phaseData[activePhaseTab].keyGoals.map((goal, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-[11px] text-slate-500 italic mt-2">
            💡 Strategy: {phaseData[activePhaseTab].strategy}
          </div>
        </div>
      </div>

      {/* 90-Day Interactive Grid */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">90-Day Preparation Calendar</h2>
            <p className="text-xs text-slate-500">Click any day to inspect or log sessions</p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-600 ring-2 ring-indigo-300" />
              <span className="text-slate-600">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-600">Logged Study</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-200" />
              <span className="text-slate-600">No Activity</span>
            </div>
          </div>
        </div>

        {/* 90 Days Matrix */}
        <div className="grid grid-cols-5 sm:grid-cols-9 md:grid-cols-10 lg:grid-cols-15 gap-2">
          {calendarDays.map((d) => {
            const isSelected = selectedDayIndex === d.dayNumber;

            return (
              <button
                key={d.dayNumber}
                type="button"
                onClick={() => setSelectedDayIndex(d.dayNumber)}
                className={`p-2 rounded-lg border text-left transition-all relative flex flex-col justify-between h-16 ${
                  isSelected
                    ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/50 shadow-sm'
                    : d.isToday
                    ? 'border-indigo-400 bg-indigo-50/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[11px] font-bold ${d.isToday ? 'text-indigo-700' : 'text-slate-700'}`}>
                    D{d.dayNumber}
                  </span>
                  {d.loggedMinutes > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>

                <div className="text-[10px] text-slate-400 leading-tight">
                  {d.displayDate}
                </div>

                <div className="text-[9px] font-semibold">
                  {d.loggedMinutes > 0 ? (
                    <span className="text-emerald-700">{d.loggedMinutes}m</span>
                  ) : d.isPast ? (
                    <span className="text-slate-300">0m</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspector */}
      {selectedDayInfo && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-md">
                  Day {selectedDayInfo.dayNumber} of {totalDays}
                </span>
                <span className="text-xs text-slate-500">
                  {selectedDayInfo.dateStr}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded">
                  Phase {selectedDayInfo.phase}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Study Log for Day {selectedDayInfo.dayNumber}
              </h3>
            </div>

            <Link
              href="/daily-plan"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all self-start sm:self-center"
            >
              <span>Open in Daily Study Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 font-medium">Logged Study Time</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {selectedDayInfo.loggedMinutes > 0
                  ? formatMinutes(selectedDayInfo.loggedMinutes)
                  : '0m recorded'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 font-medium">Daily Goal</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                180 minutes (3 hours)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 font-medium">Status</span>
              <div className="text-sm font-semibold text-slate-800 mt-1">
                {selectedDayInfo.status === 'COMPLETED'
                  ? 'Target Studied'
                  : selectedDayInfo.status === 'TODAY'
                  ? 'Active Preparation Day'
                  : selectedDayInfo.status === 'MISSED'
                  ? 'Rest / No study recorded'
                  : 'Upcoming Schedule'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
