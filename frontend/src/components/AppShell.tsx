'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import AuthView from '@/components/AuthView';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col print:bg-white print:text-slate-900 print:min-h-0 print:block">
      <div className="no-print">
        <Navbar />
      </div>
      <div className="flex-1 pb-36 md:pb-12 print:p-0 print:m-0 print:flex-none">
        {children}
      </div>
      <div className="no-print">
        <BottomNav />
      </div>
    </div>
  );
}
