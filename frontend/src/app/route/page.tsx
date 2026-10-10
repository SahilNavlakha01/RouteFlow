'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AuthView from '@/components/AuthView';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import DatePicker from '@/components/DatePicker';
import { api } from '@/lib/api';
import {
  Zap,
  Calendar,
  Building,
  CheckCircle2,
  Plus,
  Minus,
  X,
  Save,
  Phone,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  UserPlus,
  RotateCcw,
} from 'lucide-react';

export default function RouteEntryPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  // Date & Filter states
  const [selectedDate, setSelectedDate] = useState('');
  const [societies, setSocieties] = useState<any[]>([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState<string>('all');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('all');

  useEffect(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Core data states
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Entry Modal State
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [modalEntryDate, setModalEntryDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [loadingEntryForDate, setLoadingEntryForDate] = useState(false);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
  const [entryStatus, setEntryStatus] = useState<string>('collected');
  const [entryNotes, setEntryNotes] = useState<string>('');
  const [instantPaid, setInstantPaid] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick Add Customer modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustFlat, setNewCustFlat] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustSocietyId, setNewCustSocietyId] = useState('');
  const [newCustBlockId, setNewCustBlockId] = useState('');

  // Fetch initial master data
  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [socRes, servRes] = await Promise.all([
        api.getLocations(),
        api.getServices(),
      ]);
      if (socRes?.societies) setSocieties(socRes.societies);
      if (servRes?.services) setServices(servRes.services);
    } catch (err) {
      console.error('Master data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers and entries for selected filters and date
  const loadRouteData = async () => {
    try {
      const custParams: any = {};
      if (selectedSocietyId !== 'all') custParams.society_id = selectedSocietyId;
      if (selectedBlockId !== 'all') custParams.block_id = selectedBlockId;

      const [custRes, entryRes] = await Promise.all([
        api.getCustomers(custParams),
        api.getDailyEntries({ date: selectedDate }),
      ]);

      if (custRes?.customers) setCustomers(custRes.customers);
      if (entryRes?.entries) setDailyEntries(entryRes.entries);
    } catch (err) {
      console.error('Route data load error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadMasterData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadRouteData();
    }
  }, [user, selectedDate, selectedSocietyId, selectedBlockId]);

  if (authLoading) return null;
  if (!user) return <AuthView />;

  const currency = user.currency || '₹';

  // Get active blocks based on selected society
  const currentSociety = societies.find((s) => String(s.id) === String(selectedSocietyId));
  const availableBlocks = currentSociety ? currentSociety.blocks || [] : [];

  // Helper to populate or reset modal state from entry object
  const applyEntryData = (existing: any | null) => {
    if (existing && existing.items) {
      const qtyMap: Record<number, number> = {};
      for (const it of existing.items) {
        if (it.service_id) {
          qtyMap[it.service_id] = parseFloat(it.quantity) || 0;
        }
      }
      setItemQuantities(qtyMap);
      setEntryStatus(existing.status || 'collected');
      setEntryNotes(existing.notes || '');
      setInstantPaid(existing.paid_amount ? String(existing.paid_amount) : '');
    } else {
      setItemQuantities({});
      setEntryStatus('collected');
      setEntryNotes('');
      setInstantPaid('');
    }
  };

  // Open entry modal for customer (defaults to selectedDate or today)
  const handleOpenEntry = (cust: any) => {
    setActiveCustomer(cust);
    setSaveSuccess(false);
    const targetDate = selectedDate || new Date().toISOString().split('T')[0];
    setModalEntryDate(targetDate);

    // If target date is same as page date, use already loaded dailyEntries
    const existing = dailyEntries.find((e) => Number(e.customer_id) === Number(cust.id));
    applyEntryData(existing);
  };

  // Change date inside the entry modal (allows logging past date entries)
  const handleModalDateChange = async (newDate: string) => {
    setModalEntryDate(newDate);
    if (!activeCustomer) return;

    if (newDate === selectedDate) {
      const existing = dailyEntries.find((e) => Number(e.customer_id) === Number(activeCustomer.id));
      applyEntryData(existing);
    } else {
      setLoadingEntryForDate(true);
      try {
        const res = await api.getDailyEntries({ customer_id: activeCustomer.id, date: newDate });
        const existing = res?.entries && res.entries.length > 0 ? res.entries[0] : null;
        applyEntryData(existing);
      } catch (err) {
        console.error('Error fetching entry for date:', err);
        applyEntryData(null);
      } finally {
        setLoadingEntryForDate(false);
      }
    }
  };

  // Update item quantity
  const updateQuantity = (serviceId: number, delta: number) => {
    setItemQuantities((prev) => {
      const cur = prev[serviceId] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [serviceId]: next };
    });
  };

  const setDirectQuantity = (serviceId: number, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setItemQuantities((prev) => ({ ...prev, [serviceId]: num }));
  };

  // Calculate live modal total
  const computeModalTotal = () => {
    let totalAmt = 0;
    let totalItems = 0;
    for (const s of services) {
      const q = itemQuantities[s.id] || 0;
      if (q > 0) {
        totalAmt += q * parseFloat(s.price);
        totalItems += q;
      }
    }
    return { totalAmt, totalItems };
  };

  // Save daily entry
  const handleSaveEntry = async () => {
    if (!activeCustomer) return;
    const { totalAmt, totalItems } = computeModalTotal();

    if (totalItems <= 0) {
      alert('Please enter at least 1 service quantity.');
      return;
    }

    setSaving(true);
    try {
      const itemsPayload: any[] = [];
      for (const s of services) {
        const q = itemQuantities[s.id] || 0;
        if (q > 0) {
          itemsPayload.push({
            service_id: s.id,
            service_name: s.name,
            unit: s.unit,
            unit_price: parseFloat(s.price),
            quantity: q,
          });
        }
      }

      await api.createDailyEntry({
        customer_id: activeCustomer.id,
        entry_date: modalEntryDate,
        items: itemsPayload,
        status: entryStatus,
        payment_status: instantPaid && parseFloat(instantPaid) > 0 ? 'paid' : 'unpaid',
        paid_amount: parseFloat(instantPaid) || 0,
        notes: entryNotes,
      });

      setSaveSuccess(true);
      await loadRouteData();
      setTimeout(() => {
        setActiveCustomer(null);
        setSaveSuccess(false);
      }, 700);
    } catch (err: any) {
      alert('Error saving entry: ' + (err.message || 'Server error'));
    } finally {
      setSaving(false);
    }
  };

  // Quick Add customer handler
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustFlat) {
      alert('Please enter customer name and flat number.');
      return;
    }

    try {
      await api.createCustomer({
        name: newCustName,
        unit_number: newCustFlat,
        phone: newCustPhone,
        society_id: newCustSocietyId ? Number(newCustSocietyId) : null,
        block_id: newCustBlockId ? Number(newCustBlockId) : null,
      });

      setShowAddCustomer(false);
      setNewCustName('');
      setNewCustFlat('');
      setNewCustPhone('');
      await loadRouteData();
    } catch (err: any) {
      alert('Failed to add customer: ' + err.message);
    }
  };

  const { totalAmt: modalTotalAmt, totalItems: modalTotalItems } = computeModalTotal();

  // Summary counts for current route view
  const recordedCount = customers.filter((c) =>
    dailyEntries.some((e) => Number(e.customer_id) === Number(c.id))
  ).length;

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">

        {/* Top Route Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold mb-1 border border-amber-500/30">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              <span>{t('fastRoute')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {t('dailyDoorstepLedger')}
            </h1>
          </div>

          {/* Date Selector Quick Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800 transition-colors"
            >
              {t('today')}
            </button>
            <button
              onClick={() => {
                const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                setSelectedDate(yest);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800 transition-colors"
            >
              {t('yesterday')}
            </button>
            <div className="w-40 sm:w-48">
              <DatePicker
                value={selectedDate}
                onChange={(val) => setSelectedDate(val)}
                align="right"
                placeholder="Select Date"
              />
            </div>
          </div>
        </div>

        {/* Route Filter Navigation Chips (Societies & Blocks) */}
        <div className="glass-panel rounded-2xl p-4 border border-stone-800 space-y-3">

          {/* Society Selector Pills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('selectSociety')}</span>
              </div>
              <Link
                href="/locations"
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                + Manage Societies & Wings
              </Link>
            </div>

            {societies.length === 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
                <span>No Societies added yet. Add your apartment complexes/societies to filter by Wings!</span>
                <Link
                  href="/locations"
                  className="px-3 py-1 rounded-lg bg-amber-400 text-stone-950 font-bold hover:bg-amber-300 text-center self-start sm:self-auto"
                >
                  + Add Society
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => {
                    setSelectedSocietyId('all');
                    setSelectedBlockId('all');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedSocietyId === 'all'
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-stone-900/90 text-stone-400 hover:text-white border border-stone-800'
                    }`}
                >
                  {t('allSocieties')} ({societies.length})
                </button>

                {societies.map((soc) => (
                  <button
                    key={soc.id}
                    onClick={() => {
                      setSelectedSocietyId(String(soc.id));
                      setSelectedBlockId('all');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${String(selectedSocietyId) === String(soc.id)
                        ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-stone-900/90 text-stone-400 hover:text-white border border-stone-800'
                      }`}
                  >
                    {soc.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Block / Wing Selector Pills (if society selected) */}
          {selectedSocietyId !== 'all' && availableBlocks.length > 0 && (
            <div className="pt-2 border-t border-stone-800/60">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                Wings / Blocks in {currentSociety?.name}
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedBlockId('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${selectedBlockId === 'all'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-stone-900 text-stone-400 border border-stone-800'
                    }`}
                >
                  All Wings
                </button>
                {availableBlocks.map((b: any) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBlockId(String(b.id))}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${String(selectedBlockId) === String(b.id)
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-stone-900 text-stone-400 border border-stone-800'
                      }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Progress summary bar */}
          <div className="pt-2 flex items-center justify-between text-xs text-stone-400">
            <div>
              {t('routeProgress')}:{' '}
              <span className="text-white font-bold">{recordedCount}</span> /{' '}
              <span className="text-white font-bold">{customers.length}</span> {t('flatsRecorded')}
            </div>
            <button
              onClick={() => setShowAddCustomer(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t('addNewFlat')}</span>
            </button>
          </div>
        </div>

        {/* Customer Flats Grid / List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-stone-800">
            <Building className="w-10 h-10 text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No customers found for this selection</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              Add your flats and customer numbers in this society to start recording daily orders.
            </p>
            <button
              onClick={() => setShowAddCustomer(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400"
            >
              + Add First Flat
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {customers.map((cust) => {
              const existingEntry = dailyEntries.find((e) => Number(e.customer_id) === Number(cust.id));
              const isRecorded = !!existingEntry;

              return (
                <div
                  key={cust.id}
                  onClick={() => handleOpenEntry(cust)}
                  className={`rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden group active:scale-[0.98] ${isRecorded
                      ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/50'
                      : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700 hover:bg-stone-900'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">

                    {/* Flat Badge */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`shrink-0 min-w-[56px] px-2.5 h-12 rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm whitespace-nowrap transition-colors shadow-sm ${isRecorded
                            ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-400/30'
                            : 'bg-stone-800 text-stone-200 group-hover:bg-amber-500/20 group-hover:text-amber-300'
                          }`}
                      >
                        {cust.unit_number}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-white truncate">
                          {cust.name}
                        </h3>
                        {cust.society_name ? (
                          <div className="text-xs text-stone-400 mt-1 truncate flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                            <span>{cust.society_name} {cust.block_name ? `• ${cust.block_name}` : ''}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-stone-500 mt-1 italic flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                            <span>No society assigned</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pending Dues Chip */}
                    <div className="text-right shrink-0">
                      {parseFloat(cust.current_balance) > 0 ? (
                        <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 whitespace-nowrap inline-block">
                          {t('due')}: {currency}{cust.current_balance}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap inline-block">
                          {t('clear')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recorded Order Details or Quick Prompt */}
                  <div className="mt-3 pt-3 border-t border-stone-800/60 flex items-center justify-between text-xs">
                    {isRecorded ? (
                      <div className="flex items-center gap-2 text-amber-300 font-semibold min-w-0 flex-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">
                          {existingEntry.total_items} items • {currency}{parseFloat(existingEntry.total_amount).toFixed(0)}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                          {t(existingEntry.status) || existingEntry.status}
                        </span>
                      </div>
                    ) : (
                      <div className="text-stone-400 flex items-center gap-1.5 group-hover:text-amber-400 transition-colors">
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold">{t('tapToRecord')}</span>
                      </div>
                    )}

                    <div className="text-stone-500 group-hover:text-amber-400 transition-colors shrink-0 ml-2">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* FAST ENTRY POPUP / DRAWER */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="w-full sm:max-w-lg bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">

            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-800/80 flex items-center justify-between bg-stone-900/90">
              <div className="flex items-center gap-3">
                <div className="shrink-0 min-w-[54px] px-2.5 h-11 rounded-xl bg-amber-500 text-stone-950 font-extrabold flex items-center justify-center text-xs sm:text-sm whitespace-nowrap shadow-sm">
                  {activeCustomer.unit_number}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{activeCustomer.name}</h2>
                  <div className="text-xs text-stone-400">
                    {activeCustomer.society_name ? `${activeCustomer.society_name} • ` : ''}{activeCustomer.phone || 'No phone'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveCustomer(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dedicated Entry Date Section (Fixed layout, no truncation) */}
            <div className="px-4 py-3 sm:px-5 bg-stone-950/90 border-b border-stone-800/80 space-y-2.5">
              {/* Row 1: Label + Prominent Formatted Date + Past Date Indicator */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs font-semibold text-stone-400">Entry Date:</span>
                  <span className="text-xs font-extrabold text-amber-400">
                    {new Date(modalEntryDate + 'T00:00:00').toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  {modalEntryDate !== new Date().toISOString().split('T')[0] && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/25">
                      Past Date
                    </span>
                  )}
                </div>

                {loadingEntryForDate && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
                    <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span>Loading items...</span>
                  </div>
                )}
              </div>

              {/* Row 2: Equal 3-Button Selector (Today | Yesterday | Calendar) */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleModalDateChange(new Date().toISOString().split('T')[0])}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center ${modalEntryDate === new Date().toISOString().split('T')[0]
                      ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20'
                      : 'bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-850 border border-stone-800'
                    }`}
                >
                  {t('today')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                    handleModalDateChange(yest);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center ${modalEntryDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                      ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20'
                      : 'bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-850 border border-stone-800'
                    }`}
                >
                  {t('yesterday')}
                </button>

                <div className="w-full">
                  <DatePicker
                    value={modalEntryDate}
                    onChange={(val) => handleModalDateChange(val)}
                    align="right"
                    placeholder="Custom"
                    compact={true}
                    showRawDate={false}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Scrollable Services Items Picker */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                {t('selectServicesAndQty')}
              </div>

              {services.length === 0 ? (
                <div className="text-center py-6 text-stone-500 text-xs">
                  No services configured yet. Please add services in the Services tab.
                </div>
              ) : (
                services.map((service) => {
                  const qty = itemQuantities[service.id] || 0;
                  const lineTotal = qty * parseFloat(service.price);

                  return (
                    <div
                      key={service.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${qty > 0
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-stone-950/50 border-stone-800/80'
                        }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          {service.name}
                          <span className="text-[11px] font-normal text-amber-400">
                            {currency}{service.price} / {service.unit}
                          </span>
                        </div>
                        {qty > 0 && (
                          <div className="text-xs text-amber-300 font-bold mt-0.5">
                            Subtotal: {currency}{lineTotal.toFixed(0)}
                          </div>
                        )}
                      </div>

                      {/* Tactile Counter Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(service.id, -1)}
                          className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 flex items-center justify-center font-bold text-base transition-transform"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={qty === 0 ? '' : qty}
                          placeholder="0"
                          onChange={(e) => setDirectQuantity(service.id, e.target.value)}
                          className="w-12 h-9 text-center bg-stone-950 border border-stone-800 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                        />

                        <button
                          type="button"
                          onClick={() => updateQuantity(service.id, 1)}
                          className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 flex items-center justify-center font-bold text-base transition-transform shadow-md shadow-amber-500/20"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Status and Notes */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1">
                    {t('entryStatus')}
                  </label>
                  <select
                    value={entryStatus}
                    onChange={(e) => setEntryStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="collected">{t('collected')}</option>
                    <option value="in_process">{t('in_process')}</option>
                    <option value="delivered">{t('delivered')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-400 mb-1">
                    {t('instantPaid')} ({currency})
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={instantPaid}
                    onChange={(e) => setInstantPaid(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-stone-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-400 mb-1">
                  {t('notesRemarks')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14 cotton shirts, 3 blue pants"
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-stone-600"
                />
              </div>
            </div>

            {/* Footer Summary & Save CTA */}
            <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-stone-400">
                  {modalTotalItems} {t('itemsSelected')}
                </div>
                <div className="text-xl font-extrabold text-amber-400">
                  {currency}{modalTotalAmt.toFixed(0)}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveEntry}
                disabled={saving || modalTotalItems === 0}
                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${saveSuccess
                    ? 'bg-emerald-500 text-stone-950'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50'
                  }`}
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('saved')}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t('saveEntry')}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QUICK ADD CUSTOMER MODAL */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Add New Flat / Customer</h3>
              <button
                onClick={() => setShowAddCustomer(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs text-stone-300 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-300 mb-1">Door / Flat Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A/302 or 901"
                  value={newCustFlat}
                  onChange={(e) => setNewCustFlat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-300 mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+91 98250 12345"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-300 mb-1">Society</label>
                <select
                  value={newCustSocietyId}
                  onChange={(e) => {
                    setNewCustSocietyId(e.target.value);
                    setNewCustBlockId('');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="">Select Society</option>
                  {societies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400"
                >
                  Save Flat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
