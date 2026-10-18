import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateDayProgress(startDateStr, totalDays = 90) {
  if (!startDateStr) {
    return { currentDay: 1, remainingDays: 89, isFinished: false };
  }

  const start = new Date(startDateStr);
  const today = new Date();
  
  // Set both to midnight UTC for accurate day difference
  const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = todayUTC - startUTC;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // 1-indexed

  const currentDay = Math.max(1, Math.min(diffDays, totalDays));
  const remainingDays = Math.max(0, totalDays - currentDay);
  const isFinished = diffDays > totalDays;

  return { currentDay, remainingDays, isFinished };
}
