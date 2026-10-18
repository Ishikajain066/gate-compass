'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  Binary,
  Brain,
  Layers,
  ArrowUpRight,
  TrendingUp,
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
import TopicDetailModal from '@/components/TopicDetailModal';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    window.addEventListener('study-session-updated', fetchStats);
    return () => window.removeEventListener('study-session-updated', fetchStats);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const csProgress = stats?.progress?.csProgress || 0;
  const daProgress = stats?.progress?.daProgress || 0;
  const commonProgress = stats?.progress?.commonProgress || 0;

  const todayMinutes = stats?.studyTime?.todayMinutes || 0;
  const weekMinutes = stats?.studyTime?.weekMinutes || 0;
  const monthMinutes = stats?.studyTime?.monthMinutes || 0;

  const completedCount = stats?.progress?.completedTopicsCount || 0;
  const inProgressCount = stats?.progress?.inProgressTopicsCount || 0;
  const notStartedCount = stats?.progress?.notStartedTopicsCount || 0;

  const statusPieData = [
    { name: 'Completed', value: completedCount, color: '#10B981' },
    { name: 'In Progress', value: inProgressCount, color: '#F59E0B' },
    { name: 'Not Started', value: notStartedCount, color: '#E2E8F0' },
  ];

  const studyHistory = stats?.studyHistory || [];
  const weakTopics = stats?.weakTopics || [];
  const revisionsDue = stats?.revisionsDue || [];

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
          setIsModalOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Actual Saved Metrics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Preparation Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Grounded data only: verified study hours, syllabus completions, and weak area diagnostics.
          </p>
        </div>
      </div>

      {/* Top Row: Hours Studied Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-subtle card-hover">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Today's Study Time
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              {formatMinutes(todayMinutes)}
            </span>
          </div>
          <span className="mt-1 text-xs text-slate-500 block">
            Target: 3h (180m) daily
          </span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-subtle card-hover">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Study Hours (Last 7 Days)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-600">
              {formatMinutes(weekMinutes)}
            </span>
          </div>
          <span className="mt-1 text-xs text-slate-500 block">
            Weekly total GATE study
          </span>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-subtle card-hover">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Study Hours (Last 30 Days)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-violet-600">
              {formatMinutes(monthMinutes)}
            </span>
          </div>
          <span className="mt-1 text-xs text-slate-500 block">
            Monthly cumulative GATE study
          </span>
        </div>
      </div>

      {/* Charts Grid: 14-Day Study Trend + Topic Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Study Trend Bar Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Daily Study Minutes (Last 14 Days)</h2>
              <p className="text-xs text-slate-500">Actual logged study time per day</p>
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} minutes`, 'Studied']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="minutes" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Status Breakdown (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Syllabus Topics Status</h2>
              <p className="text-xs text-slate-500">Completion distribution</p>
            </div>

            <div className="mt-4 h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Completed
              </span>
              <strong>{completedCount} topics</strong>
            </div>
            <div className="flex items-center justify-between text-amber-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                In Progress
              </span>
              <strong>{inProgressCount} topics</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                Not Started
              </span>
              <strong>{notStartedCount} topics</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Weak Topics Section & Revisions Due */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weak Topics */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                Weak Topics (Confidence ≤ 2 / 5)
              </h2>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
              {weakTopics.length} Priority Topics
            </span>
          </div>

          <div className="mt-4">
            {weakTopics.length > 0 ? (
              <div className="space-y-2.5">
                {weakTopics.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => handleOpenTopic(topic.id)}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-amber-300 hover:bg-amber-50/20 cursor-pointer transition-all"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        {topic.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">
                          Track: {topic.category}
                        </span>
                        <div className="flex items-center text-[10px] text-amber-600 font-semibold gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{topic.confidence}/5</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600">Review &rarr;</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No weak topics flagged yet! Rate your confidence on syllabus topics (1–5) to highlight areas needing extra attention.
              </div>
            )}
          </div>
        </div>

        {/* Revisions Needing Attention */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-600" />
              <h2 className="text-base font-bold text-slate-900">
                Topics Needing Revision
              </h2>
            </div>
            <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full">
              {revisionsDue.length} Due
            </span>
          </div>

          <div className="mt-4">
            {revisionsDue.length > 0 ? (
              <div className="space-y-2.5">
                {revisionsDue.map((rev) => (
                  <div
                    key={rev.id}
                    onClick={() => handleOpenTopic(rev.topic_id)}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-violet-300 hover:bg-violet-50/20 cursor-pointer transition-all"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800">
                        {rev.topic_name}
                      </span>
                      <div className="text-[10px] text-rose-500 font-medium mt-0.5">
                        Scheduled: {rev.scheduled_date}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-violet-600">Revise &rarr;</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No revisions due right now. Schedule revisions as you complete syllabus topics!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <TopicDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        topic={selectedTopic}
        onUpdated={fetchStats}
      />
    </div>
  );
}
