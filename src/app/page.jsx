'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Binary,
  Brain,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { formatMinutes } from '@/lib/utils';
import StudyTimerModal from '@/components/StudyTimerModal';
import TopicDetailModal from '@/components/TopicDetailModal';

export default function OverviewPage() {
  const [stats, setStats] = useState(null);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active modals
  const [timerModalData, setTimerModalData] = useState(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    window.addEventListener('study-session-updated', fetchDashboardData);
    return () => window.removeEventListener('study-session-updated', fetchDashboardData);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, planRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/daily-plan'),
      ]);

      const [statsData, planData] = await Promise.all([
        statsRes.json(),
        planRes.json(),
      ]);

      if (statsData.success) setStats(statsData);
      if (planData.success) setDailyPlan(planData);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = (session) => {
    setTimerModalData(session);
    setIsTimerOpen(true);
  };

  const handleOpenTopic = async (topicId) => {
    try {
      const res = await fetch('/api/syllabus');
      const data = await res.json();
      if (data.success) {
        let found = null;
        if (data.subjects) {
          for (const sub of data.subjects) {
            for (const top of sub.topics || []) {
              if (top.id === topicId) {
                found = top;
                break;
              }
              for (const subtop of top.subtopics || []) {
                if (subtop.id === topicId) {
                  found = subtop;
                  break;
                }
              }
              if (found) break;
            }
            if (found) break;
          }
        }
        if (!found && data.topics) {
          found = data.topics.find((t) => t.id === topicId);
        }
        if (found) {
          setSelectedTopic(found);
          setIsTopicModalOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentDay = stats?.countdown?.currentDay || 1;
  const totalDays = stats?.countdown?.totalDays || 90;
  const remainingDays = stats?.countdown?.remainingDays ?? 89;
  const dailyGoalMinutes = stats?.countdown?.dailyGoalMinutes || 180;
  const todayStudyMinutes = stats?.studyTime?.todayMinutes || 0;

  const csProgress = stats?.progress?.csProgress || 0;
  const daProgress = stats?.progress?.daProgress || 0;
  const commonProgress = stats?.progress?.commonProgress || 0;

  // Chart data for Progress comparison
  const progressChartData = [
    { name: 'Common Shared', progress: commonProgress, color: '#8B5CF6' },
    { name: 'GATE CS', progress: csProgress, color: '#3B82F6' },
    { name: 'GATE DA', progress: daProgress, color: '#10B981' },
  ];

  const sessions = dailyPlan?.sessions || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Heading & Countdown Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GATE 2027 Dual Target — CS + DA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            Your GATE journey, one day at a time.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500 font-normal">
            Three focused hours. One step closer.
          </p>
        </div>

        {/* 90-Day Countdown Card */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-subtle flex-shrink-0">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Preparation
            </span>
            <span className="text-xl font-bold text-slate-900">
              Day {currentDay} <span className="text-sm font-normal text-slate-400">of {totalDays}</span>
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Days Left
            </span>
            <span className="text-xl font-bold text-indigo-600">
              {remainingDays} <span className="text-xs font-normal text-slate-400">days</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: CS Progress */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-subtle card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              GATE CS Progress
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Binary className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{csProgress}%</span>
            <span className="text-xs text-slate-400 font-medium">syllabus</span>
          </div>
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${csProgress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Includes 7 Shared topics</span>
            <Link href="/gate-cs" className="text-blue-600 hover:underline">
              View CS &rarr;
            </Link>
          </div>
        </div>

        {/* Card 2: DA Progress */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-subtle card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              GATE DA Progress
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{daProgress}%</span>
            <span className="text-xs text-slate-400 font-medium">syllabus</span>
          </div>
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${daProgress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Includes 7 Shared topics</span>
            <Link href="/gate-da" className="text-emerald-600 hover:underline">
              View DA &rarr;
            </Link>
          </div>
        </div>

        {/* Card 3: Common Topics Progress */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-subtle card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Common Topics Progress
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{commonProgress}%</span>
            <span className="text-xs text-slate-400 font-medium">shared core</span>
          </div>
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${commonProgress}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Updates CS + DA simultaneously</span>
            <Link href="/common-topics" className="text-purple-600 hover:underline">
              Compare &rarr;
            </Link>
          </div>
        </div>

        {/* Card 4: Today's GATE Study Time */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-subtle card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today's GATE Study Time
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-indigo-700">
              {formatMinutes(todayStudyMinutes)}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {formatMinutes(dailyGoalMinutes)}
            </span>
          </div>
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.round((todayStudyMinutes / dailyGoalMinutes) * 100))}%`,
              }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {todayStudyMinutes >= dailyGoalMinutes
                ? 'Target reached today!'
                : `${formatMinutes(Math.max(0, dailyGoalMinutes - todayStudyMinutes))} remaining`}
            </span>
            <Link href="/daily-plan" className="text-indigo-600 hover:underline">
              Daily Plan &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Grid: Today's Study Plan + Preparation Progress Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Study Plan Card (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Today's Study Plan</h2>
                <p className="text-xs text-slate-500">
                  Target: 3 focused hours (180 minutes) • No dual-counting
                </p>
              </div>
            </div>
            <Link
              href="/daily-plan"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
            >
              <span>Edit Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {sessions.map((session, idx) => {
              const isDone = session.completed;
              return (
                <div
                  key={session.id || idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-emerald-50/40 border-emerald-200/70'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold flex-shrink-0 ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {session.activity}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
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
                      <p className="text-xs text-slate-500 mt-0.5">
                        Planned: {session.planned_minutes}m • Logged:{' '}
                        <strong className="text-slate-800 font-semibold">
                          {session.actual_minutes || 0}m
                        </strong>
                        {session.notes && ` — "${session.notes}"`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleStartSession(session)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{session.actual_minutes > 0 ? 'Resume' : 'Start'}</span>
                    </button>
                    {isDone && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Done</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preparation Progress Comparison Chart (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Syllabus Progress</h2>
                <p className="text-xs text-slate-500">Atomic syllabus items completion</p>
              </div>
            </div>

            <div className="mt-4 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    formatter={(val) => [`${val}% completed`, 'Progress']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  />
                  <Bar dataKey="progress" radius={[0, 6, 6, 0]}>
                    {progressChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3.5 mt-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Completed Topics:</span>
              <strong className="text-slate-900 font-semibold">{stats?.progress?.completedTopicsCount || 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>In-Progress Topics:</span>
              <strong className="text-slate-900 font-semibold">{stats?.progress?.inProgressTopicsCount || 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>Remaining Topics:</span>
              <strong className="text-slate-900 font-semibold">{stats?.progress?.notStartedTopicsCount || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Continue Learning & Revision Due */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Continue Learning */}
        <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">Continue Learning</h2>
            </div>
            <Link href="/syllabus" className="text-xs text-indigo-600 hover:underline">
              All Topics &rarr;
            </Link>
          </div>

          <div className="mt-4">
            {stats?.recentTopics && stats.recentTopics.length > 0 ? (
              <div className="space-y-2.5">
                {stats.recentTopics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => handleOpenTopic(topic.id)}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800">
                          {topic.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                            topic.category === 'COMMON'
                              ? 'bg-purple-100 text-purple-700'
                              : topic.category === 'CS_ONLY'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {topic.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Status: {topic.status}
                      </span>
                    </div>
                    <span className="text-xs text-indigo-600 font-medium">Open &rarr;</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recently studied topics yet. Start your first session from the Daily Study Plan above!
              </div>
            )}
          </div>
        </div>

        {/* Revision Due */}
        <div className="p-6 rounded-xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-violet-600" />
              <h2 className="text-base font-semibold text-slate-900">Revision Due</h2>
            </div>
            <Link href="/revision" className="text-xs text-violet-600 hover:underline">
              Revision Center &rarr;
            </Link>
          </div>

          <div className="mt-4">
            {stats?.revisionsDue && stats.revisionsDue.length > 0 ? (
              <div className="space-y-2.5">
                {stats.revisionsDue.map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => handleOpenTopic(rev.topic_id)}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800">
                          {rev.topic_name}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-semibold rounded ${
                            rev.category === 'COMMON'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rev.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-rose-500 font-medium">
                        Due: {rev.scheduled_date}
                      </span>
                    </div>
                    <span className="text-xs text-violet-600 font-medium">Revise &rarr;</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No revisions due right now! Schedule revisions as you complete topics.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <StudyTimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        initialData={timerModalData}
      />

      <TopicDetailModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        topic={selectedTopic}
        onUpdated={fetchDashboardData}
      />
    </div>
  );
}
