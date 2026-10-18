'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Play, Clock, Flame, Sparkles } from 'lucide-react';
import { formatMinutes } from '@/lib/utils';

export default function Header({ setMobileOpen, onOpenTimer }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
    // Listen for custom study session update events
    window.addEventListener('study-session-updated', fetchStats);
    return () => window.removeEventListener('study-session-updated', fetchStats);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentDay = stats?.countdown?.currentDay || 1;
  const totalDays = stats?.countdown?.totalDays || 90;
  const todayMinutes = stats?.studyTime?.todayMinutes || 0;
  const dailyGoal = stats?.studyTime?.dailyGoalMinutes || 180;
  const percentDone = Math.min(100, Math.round((todayMinutes / dailyGoal) * 100));

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-slate-500 rounded-lg hover:text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-800">GATE 2027</span>
          <span>•</span>
          <span>Dual Track (CS + DA)</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Countdown Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 text-slate-700 text-xs font-medium border border-slate-200/60">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>
            Day <strong className="text-slate-900 font-semibold">{currentDay}</strong> of {totalDays}
          </span>
        </div>

        {/* Today's GATE Time Gauge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-900 font-medium">
          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span>
            Today: <strong className="font-semibold text-indigo-700">{formatMinutes(todayMinutes)}</strong> / {formatMinutes(dailyGoal)}
          </span>
          <div className="hidden md:block w-14 h-1.5 bg-indigo-200/70 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${percentDone}%` }}
            />
          </div>
        </div>

        {/* Quick Study Timer Launch Button */}
        <button
          onClick={onOpenTimer}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Start Timer</span>
        </button>
      </div>
    </header>
  );
}
