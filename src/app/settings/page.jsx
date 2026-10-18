'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Database,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cloud,
} from 'lucide-react';
import { getTodayDateString } from '@/lib/utils';

export default function SettingsPage() {
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(180);
  const [prepStartDate, setPrepStartDate] = useState(getTodayDateString());
  const [prepTotalDays, setPrepTotalDays] = useState(90);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        if (data.settings.daily_goal_minutes) {
          setDailyGoalMinutes(Number(data.settings.daily_goal_minutes));
        }
        if (data.settings.prep_start_date) {
          setPrepStartDate(data.settings.prep_start_date);
        }
        if (data.settings.prep_total_days) {
          setPrepTotalDays(Number(data.settings.prep_total_days));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_goal_minutes: dailyGoalMinutes,
          prep_start_date: prepStartDate,
          prep_total_days: prepTotalDays,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveMessage('Settings updated successfully!');
        window.dispatchEvent(new CustomEvent('study-session-updated'));
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (e) {
      console.error(e);
      setSaveMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReseed = async (resetProgress = false) => {
    if (resetProgress) {
      const ok = window.confirm(
        'Are you sure you want to reset all recorded study progress, logs, and revisions back to 0? This cannot be undone.'
      );
      if (!ok) return;
    }

    setIsSeeding(true);
    setSeedMessage('');

    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetProgress }),
      });

      const data = await res.json();
      if (data.success) {
        setSeedMessage(data.message);
        window.dispatchEvent(new CustomEvent('study-session-updated'));
        setTimeout(() => setSeedMessage(''), 4000);
      }
    } catch (e) {
      console.error(e);
      setSeedMessage('Failed to seed syllabus.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <SettingsIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>Configuration & Controls</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Settings & Database Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure your daily target, start date, and manage database persistence.
          </p>
        </div>
      </div>

      {/* Target & Schedule Preferences Form */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
        <h2 className="text-base font-bold text-slate-900 mb-1">
          Study Target & Countdown Schedule
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          These settings govern your daily study target bar and countdown badges throughout the dashboard.
        </p>

        <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Daily GATE Study Target (Minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="30"
                step="15"
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                className="w-48 px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
              <span className="text-xs text-slate-500">
                = {Math.floor(dailyGoalMinutes / 60)}h {dailyGoalMinutes % 60}m per day
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Standard target: 180 minutes (3 hours).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preparation Start Date
            </label>
            <input
              type="date"
              value={prepStartDate}
              onChange={(e) => setPrepStartDate(e.target.value)}
              className="w-48 px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Used to calculate Day X of 90 on the dashboard.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Total Preparation Days
            </label>
            <input
              type="number"
              min="30"
              max="365"
              value={prepTotalDays}
              onChange={(e) => setPrepTotalDays(Number(e.target.value))}
              className="w-48 px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Standard: 90 days.
            </p>
          </div>

          <div className="pt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
            {saveMessage && (
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {saveMessage}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Database & Cloud Persistence Info */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Database Persistence & Turso Configuration
            </h2>
            <p className="text-xs text-slate-500">
              High-performance SQLite engine supporting both local development and hosted Turso in production.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <span className="font-bold text-slate-800 block mb-1">
              Local Development Mode:
            </span>
            <p className="text-slate-600 mb-2">
              Currently connected to local file database: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-indigo-700 font-mono">gate_compass.db</code>.
            </p>
            <p className="text-slate-500 text-[11px]">
              All data persists between page reloads, server restarts, and browser restarts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
            <span className="font-bold text-slate-800 block mb-1">
              Vercel Production Deployment (Turso):
            </span>
            <p className="text-slate-600 mb-2">
              For Vercel, simply provide your Turso credentials in the Vercel project environment variables:
            </p>
            <div className="space-y-1 font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
              <div>TURSO_DATABASE_URL=libsql://...</div>
              <div>TURSO_AUTH_TOKEN=ey...</div>
            </div>
          </div>
        </div>

        {/* Database Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            type="button"
            disabled={isSeeding}
            onClick={() => handleReseed(false)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sync / Re-seed Syllabus Topics</span>
          </button>

          <button
            type="button"
            disabled={isSeeding}
            onClick={() => handleReseed(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Reset All Progress (Start Fresh at 0%)</span>
          </button>

          {seedMessage && (
            <span className="text-xs font-medium text-emerald-600">
              {seedMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
