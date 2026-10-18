'use client';

import React, { useState } from 'react';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StudyTimerModal from '@/components/StudyTimerModal';

export default function RootLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>GATE COMPASS — CS + DA Preparation Tracker</title>
        <meta
          name="description"
          content="Dual-track preparation dashboard for GATE 2027 Computer Science (CS) and Data Science & AI (DA)."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-[#FBFBF9] text-[#0F172A] antialiased selection:bg-indigo-100 selection:text-indigo-800">
        <div className="min-h-screen flex">
          {/* Collapsible Sidebar */}
          <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

          {/* Main Area */}
          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:pl-64">
            {/* Top Navigation */}
            <Header
              setMobileOpen={setMobileOpen}
              onOpenTimer={() => setTimerOpen(true)}
            />

            {/* Content View */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>

        {/* Global Study Timer Modal */}
        <StudyTimerModal
          isOpen={timerOpen}
          onClose={() => setTimerOpen(false)}
        />
      </body>
    </html>
  );
}
