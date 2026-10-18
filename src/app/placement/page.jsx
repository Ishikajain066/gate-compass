'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Tag,
  ShieldCheck,
} from 'lucide-react';

const CATEGORIES = ['DSA', 'Aptitude', 'Core CS', 'Interview Prep', 'Projects', 'Resume'];

export default function PlacementPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Add Item Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('DSA');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    fetchPlacementItems();
  }, []);

  const fetchPlacementItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/placement');
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (item) => {
    const nextStatus =
      item.status === 'COMPLETED'
        ? 'NOT_STARTED'
        : item.status === 'IN_PROGRESS'
        ? 'COMPLETED'
        : 'IN_PROGRESS';

    try {
      const res = await fetch('/api/placement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/placement?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      const res = await fetch('/api/placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          title: newTitle,
          priority: newPriority,
          notes: newNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setNewTitle('');
        setNewNotes('');
        await fetchPlacementItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  const completedCount = items.filter((i) => i.status === 'COMPLETED').length;
  const inProgressCount = items.filter((i) => i.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5 text-slate-600" />
            <span>Campus Placements Tracker</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Placement Preparation
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            DSA, Aptitude, Core CS, System Design, Projects, and Resume tracking.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all self-start md:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Placement Task</span>
        </button>
      </div>

      {/* Strict Isolation Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800 font-semibold">Strict Boundary Protection:</strong>{' '}
          This section is 100% independent from your GATE statistics. Activity, practice questions, or hours spent here do not alter your 3-hour daily GATE study target or syllabus completion percentages.
        </div>
      </div>

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200/80">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({items.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = items.filter((i) => i.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isDone = item.status === 'COMPLETED';
          const isInProgress = item.status === 'IN_PROGRESS';

          return (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-white shadow-subtle transition-all ${
                isDone
                  ? 'border-emerald-200/70 bg-emerald-50/20'
                  : isInProgress
                  ? 'border-amber-200/70'
                  : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => handleStatusToggle(item)}
                  className={`mt-0.5 p-1 rounded-md text-xs transition-colors flex-shrink-0 ${
                    isDone
                      ? 'text-emerald-600 bg-emerald-100'
                      : isInProgress
                      ? 'text-amber-600 bg-amber-100'
                      : 'text-slate-300 hover:text-slate-500 bg-slate-100'
                  }`}
                  title="Click to toggle status"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded">
                      {item.category}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                        item.priority === 'High'
                          ? 'bg-rose-100 text-rose-700'
                          : item.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.priority}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3
                    className={`text-sm font-semibold ${
                      isDone ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                  >
                    {item.title}
                  </h3>
                  {item.notes && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            No placement items in this category. Click "Add Placement Task" above to add one.
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-elevated border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Add Placement Prep Item</h3>
              <p className="text-xs text-slate-500">Track interviews, DSA, and resume without affecting GATE stats</p>
            </div>
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task / Target Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Practice 5 LeetCode Dynamic Programming problems"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Focus on recursive patterns and memoization"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
