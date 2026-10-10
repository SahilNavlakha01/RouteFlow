'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AuthView from '@/components/AuthView';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { api } from '@/lib/api';
import {
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  PackageCheck,
  AlertCircle,
  Users,
  ArrowRight,
  PlusCircle,
  FileText,
  Calendar,
  Sparkles,
  Building,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardSummary();
      if (res?.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const currency = user.currency || '₹';

  return (
    <div className="min-h-screen bg-stone-950 pb-24 md:pb-12 text-stone-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        
        {/* Welcome Banner & Route Launcher */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/15 via-stone-900 to-stone-900 border border-amber-500/25 p-6 sm:p-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('todayRoute')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {user.business_name}
              </h1>
              <p className="mt-1 text-sm text-stone-300 max-w-xl">
                Ready to collect daily items? Jump straight into the fast route entry sheet to log flat-wise orders in seconds.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/route"
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4 fill-stone-950" />
                <span>{t('startRoute')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/invoices"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-stone-800/80 hover:bg-stone-800 text-stone-200 text-sm font-medium border border-stone-700 transition-colors"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>{t('generateBills')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Dynamic KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          
          {/* Today's Revenue */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-stone-800/80 relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-medium text-stone-400 mb-2">
              <span>{t('todayBilled')}</span>
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {currency}{stats?.today?.revenue?.toLocaleString() || '0'}
            </div>
            <div className="mt-1.5 text-xs text-stone-400 flex items-center gap-1.5">
              <span className="text-amber-400 font-semibold">{stats?.today?.entries || 0}</span> {t('flatsRecordedToday')}
            </div>
          </div>

          {/* Today's Pieces Collected */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-stone-800/80 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-medium text-stone-400 mb-2">
              <span>{t('piecesCollected')}</span>
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <PackageCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats?.today?.items || 0}
              <span className="text-xs font-normal text-stone-400 ml-1">pcs / items</span>
            </div>
            <div className="mt-1.5 text-xs text-stone-400">
              {t('thisMonth')}: <span className="text-stone-200 font-medium">{stats?.month?.items || 0}</span>
            </div>
          </div>

          {/* Outstanding Market Dues */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-stone-800/80 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-medium text-stone-400 mb-2">
              <span>{t('pendingDues')}</span>
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <AlertCircle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400">
              {currency}{stats?.financials?.total_market_dues?.toLocaleString() || '0'}
            </div>
            <Link
              href="/customers"
              className="mt-1.5 text-xs text-stone-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <span>{t('viewLedgers')}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Active Customers & Societies */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-stone-800/80 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-medium text-stone-400 mb-2">
              <span>{t('activeNetwork')}</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats?.financials?.total_customers || 0}
              <span className="text-xs font-normal text-stone-400 ml-1">customers</span>
            </div>
            <div className="mt-1.5 text-xs text-stone-400 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-stone-500" />
              <span>{stats?.financials?.total_societies || 0} {t('societiesMapped')}</span>
            </div>
          </div>
        </div>

        {/* Quick Route Shortcuts & Recent Entries */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Daily Entries Table */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-5 sm:p-6 border border-stone-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  {t('recentEntries')}
                </h2>
                <p className="text-xs text-stone-400">{t('recentSubtitle')}</p>
              </div>
              <Link
                href="/route"
                className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>{t('viewRoute')}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !stats?.recent_entries || stats.recent_entries.length === 0 ? (
              <div className="text-center py-10 text-stone-500 text-sm">
                No entries recorded yet. Tap "Start Today's Route" to make your first entry!
              </div>
            ) : (
              <div className="divide-y divide-stone-800/60">
                {stats.recent_entries.map((entry: any) => {
                  const statusColors: Record<string, string> = {
                    collected: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                    in_process: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
                    delivered: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
                  };

                  return (
                    <div
                      key={entry.id}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-stone-900/30 rounded-xl px-2 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 min-w-[52px] px-2 h-10 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center font-bold text-xs text-amber-400 whitespace-nowrap">
                          {entry.unit_number || 'Flat'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white flex items-center gap-2">
                            {entry.customer_name}
                            <span className="text-[11px] text-stone-400 font-normal">
                              {entry.society_name} {entry.block_name ? `• ${entry.block_name}` : ''}
                            </span>
                          </div>
                          <div className="text-xs text-stone-400 mt-0.5">
                            {entry.total_items} items • {entry.notes || 'Routine pickup'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          {currency}{parseFloat(entry.total_amount).toFixed(0)}
                        </div>
                        <span
                          className={`inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                            statusColors[entry.status] || 'bg-stone-800 text-stone-300 border-stone-700'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions & Business Setup */}
          <div className="space-y-4">
            
            {/* Quick Actions Card */}
            <div className="glass-panel rounded-2xl p-5 border border-stone-800">
              <h3 className="text-sm font-bold text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/route"
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-900/80 hover:bg-stone-800/80 border border-stone-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Daily Fast Route</div>
                      <div className="text-[11px] text-stone-400">Pickups & Deliveries</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400 transition-colors" />
                </Link>

                <Link
                  href="/customers"
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-900/80 hover:bg-stone-800/80 border border-stone-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Customer Directory</div>
                      <div className="text-[11px] text-stone-400">Flats, Balances & Ledgers</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-emerald-400 transition-colors" />
                </Link>

                <Link
                  href="/invoices"
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-900/80 hover:bg-stone-800/80 border border-stone-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Billing & Statements</div>
                      <div className="text-[11px] text-stone-400">PDF & WhatsApp Receipts</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-blue-400 transition-colors" />
                </Link>
              </div>
            </div>

            {/* Catalog Info Widget */}
            <div className="glass-panel rounded-2xl p-5 border border-stone-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Active Catalog</h3>
                <Link href="/services" className="text-xs text-amber-400 hover:underline">
                  Manage ({stats?.financials?.total_services || 0})
                </Link>
              </div>
              <p className="text-xs text-stone-400 mb-3">
                Configure your pricing per piece/kg or meal to keep daily entry lightning-fast.
              </p>
              <Link
                href="/services"
                className="w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add / Edit Services</span>
              </Link>
            </div>

          </div>

        </div>

      </main>

      <BottomNav />
    </div>
  );
}
