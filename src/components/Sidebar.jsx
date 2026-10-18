'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  LayoutDashboard,
  BookOpen,
  Layers,
  Binary,
  Brain,
  CalendarCheck,
  RotateCcw,
  Calendar,
  BarChart3,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Syllabus Tracker', href: '/syllabus', icon: BookOpen },
  { name: 'Common Topics', href: '/common-topics', icon: Layers, highlight: true },
  { name: 'GATE CS', href: '/gate-cs', icon: Binary },
  { name: 'GATE DA', href: '/gate-da', icon: Brain },
  { name: 'Daily Study Plan', href: '/daily-plan', icon: CalendarCheck, badge: '3h Goal' },
  { name: 'Revision Center', href: '/revision', icon: RotateCcw },
  { name: 'Study Calendar', href: '/calendar', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Placement Prep', href: '/placement', icon: Briefcase, tag: 'Separate' },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
          <Link
            href="/"
            className="flex items-center gap-3 overflow-hidden text-slate-900 focus:outline-none"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm flex-shrink-0">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm tracking-tight text-slate-900 truncate">
                  GATE COMPASS
                </span>
                <span className="text-[11px] font-medium text-indigo-600 tracking-wider uppercase">
                  CS + DA 2027
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.name : undefined}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />

                {!collapsed && (
                  <span className="truncate flex-1">{item.name}</span>
                )}

                {!collapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-indigo-600 bg-indigo-100/70 rounded-full">
                    {item.badge}
                  </span>
                )}

                {!collapsed && item.tag && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 rounded-md">
                    {item.tag}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* 90-Day Tracker Footer & Collapse Toggle */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          {!collapsed && (
            <div className="p-3 mb-2 rounded-lg bg-indigo-50/60 border border-indigo-100/60">
              <div className="flex items-center justify-between text-xs text-indigo-900 font-medium mb-1">
                <span>GATE Focus</span>
                <span className="text-indigo-600 font-semibold">180m / day</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                90-Day Dual Strategy for CS + DA. No wasted repetitions.
              </p>
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 text-xs font-medium text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
