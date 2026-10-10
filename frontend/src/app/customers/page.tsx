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
  Users,
  Search,
  Plus,
  Phone,
  Building,
  ArrowRight,
  FileText,
  CreditCard,
  Edit2,
  Trash2,
  X,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export default function CustomersPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<any[]>([]);
  const [societies, setSocieties] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterSociety, setFilterSociety] = useState('all');
  const [loading, setLoading] = useState(true);

  // Selected customer for full ledger modal
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [ledgerData, setLedgerData] = useState<any | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formFlat, setFormFlat] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSocietyId, setFormSocietyId] = useState('');
  const [formBlockId, setFormBlockId] = useState('');
  const [formOpeningBalance, setFormOpeningBalance] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Payment Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  useEffect(() => {
    setPaymentDate(new Date().toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterSociety !== 'all') params.society_id = filterSociety;
      if (search) params.search = search;

      const [cRes, sRes] = await Promise.all([
        api.getCustomers(params),
        api.getLocations(),
      ]);

      if (cRes?.customers) setCustomers(cRes.customers);
      if (sRes?.societies) setSocieties(sRes.societies);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, filterSociety, search]);

  const openLedger = async (cust: any) => {
    setSelectedCustomer(cust);
    setLoadingLedger(true);
    try {
      const res = await api.getCustomerById(cust.id);
      if (res?.customer) {
        setLedgerData(res.customer);
      }
    } catch (err) {
      console.error('Ledger error:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormFlat('');
    setFormPhone('');
    setFormSocietyId(societies[0]?.id ? String(societies[0].id) : '');
    setFormBlockId('');
    setFormOpeningBalance('0');
    setFormNotes('');
    setModalOpen(true);
  };

  const openEditModal = (cust: any) => {
    setEditingId(cust.id);
    setFormName(cust.name);
    setFormFlat(cust.unit_number);
    setFormPhone(cust.phone || '');
    setFormSocietyId(cust.society_id ? String(cust.society_id) : '');
    setFormBlockId(cust.block_id ? String(cust.block_id) : '');
    setFormOpeningBalance(String(cust.opening_balance || 0));
    setFormNotes(cust.notes || '');
    setModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formFlat) {
      alert('Name and flat are required');
      return;
    }

    try {
      const payload = {
        name: formName,
        unit_number: formFlat,
        phone: formPhone,
        society_id: formSocietyId ? Number(formSocietyId) : null,
        block_id: formBlockId ? Number(formBlockId) : null,
        opening_balance: parseFloat(formOpeningBalance) || 0,
        notes: formNotes,
      };

      if (editingId) {
        await api.updateCustomer(editingId, payload);
      } else {
        await api.createCustomer(payload);
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer and their past records?')) return;
    try {
      await api.deleteCustomer(id);
      loadData();
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentAmount) return;

    try {
      await api.recordPayment({
        customer_id: selectedCustomer.id,
        amount: parseFloat(paymentAmount),
        payment_date: paymentDate,
        payment_mode: paymentMode,
        notes: paymentNotes,
      });

      setPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentNotes('');
      openLedger(selectedCustomer);
      loadData();
    } catch (err: any) {
      alert('Error recording payment: ' + err.message);
    }
  };

  if (authLoading) return null;
  if (!user) return <AuthView />;

  const currency = user.currency || '₹';
  const selectedSocObj = societies.find((s) => String(s.id) === String(formSocietyId));
  const modalBlocks = selectedSocObj ? selectedSocObj.blocks || [] : [];

  return (
    <div className="min-h-screen bg-stone-950 pb-24 md:pb-12 text-stone-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              {t('customerDirectory')}
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              Manage resident flats, contact details, and account balance ledgers.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addResident')}</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-stone-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterSociety}
              onChange={(e) => setFilterSociety(e.target.value)}
              className="px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="all">{t('allSocieties')} ({societies.length})</option>
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customers Table / Grid */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-stone-800">
            <Users className="w-8 h-8 text-stone-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-white">No customers match your criteria</div>
            <p className="text-xs text-stone-400 mt-1">Add your customer flats to build your route ledger.</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-stone-800 overflow-hidden">
            <div className="divide-y divide-stone-800/60">
              {customers.map((cust) => {
                const dueAmt = parseFloat(cust.current_balance) || 0;

                return (
                  <div
                    key={cust.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="shrink-0 min-w-[56px] px-2.5 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-black text-amber-400 text-xs sm:text-sm whitespace-nowrap shadow-sm">
                        {cust.unit_number}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                          <span className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-none">
                            {cust.name}
                          </span>
                          {cust.phone && (
                            <a
                              href={`tel:${cust.phone}`}
                              className="text-stone-400 hover:text-amber-400 text-xs inline-flex items-center gap-1 font-mono text-[11px]"
                            >
                              <Phone className="w-3 h-3 text-amber-400/80" />
                              <span>{cust.phone}</span>
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5 truncate">
                          {cust.society_name} {cust.block_name ? `• ${cust.block_name}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-5">
                      <div className="text-right">
                        <div className="text-xs text-stone-400">{t('currentBalance')}</div>
                        <div
                          className={`text-sm font-extrabold ${
                            dueAmt > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {currency}{dueAmt.toFixed(0)}
                          <span className="text-[10px] font-normal ml-1">
                            {dueAmt > 0 ? t('due') : t('clear')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openLedger(cust)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{t('ledger')}</span>
                        </button>

                        <button
                          onClick={() => openEditModal(cust)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteCustomer(cust.id)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* CUSTOMER FULL LEDGER DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="w-full sm:max-w-2xl bg-stone-900 border border-stone-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900/90">
              <div className="flex items-center gap-3">
                <div className="shrink-0 min-w-[54px] px-2.5 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black flex items-center justify-center text-sm sm:text-base whitespace-nowrap shadow-md shadow-amber-500/20">
                  {selectedCustomer.unit_number}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{selectedCustomer.name}</h2>
                  <div className="text-xs text-stone-400">
                    {selectedCustomer.society_name} • Phone: {selectedCustomer.phone || 'None'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Balances Ribbon */}
            {ledgerData && (
              <div className="grid grid-cols-3 gap-2 p-4 bg-stone-950/60 border-b border-stone-800 text-center">
                <div className="p-2 rounded-xl bg-stone-900">
                  <div className="text-[10px] text-stone-400">{t('totalBilled')}</div>
                  <div className="text-sm font-bold text-white">
                    {currency}{ledgerData.total_billed?.toFixed(0)}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-stone-900">
                  <div className="text-[10px] text-stone-400">{t('totalPaid')}</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {currency}{ledgerData.total_paid?.toFixed(0)}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-stone-900">
                  <div className="text-[10px] text-stone-400">{t('netDueBalance')}</div>
                  <div className="text-sm font-extrabold text-rose-400">
                    {currency}{ledgerData.current_balance?.toFixed(0)}
                  </div>
                </div>
              </div>
            )}

            {/* Chronological Ledger List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Transaction & Route History
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaymentModalOpen(true)}
                    className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{t('recordPayment')}</span>
                  </button>

                  <Link
                    href={`/invoices?customer_id=${selectedCustomer.id}`}
                    className="px-3 py-1 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t('billPdf')}</span>
                  </Link>
                </div>
              </div>

              {loadingLedger ? (
                <div className="py-12 flex justify-center">
                  <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !ledgerData?.entries || ledgerData.entries.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-xs">
                  No pickup entries recorded yet for this customer.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ledgerData.entries.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800/80 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{entry.entry_date?.substring(0, 10)}</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                            {entry.status}
                          </span>
                        </div>

                        {entry.items && (
                          <div className="text-xs text-stone-300 mt-1 space-y-0.5">
                            {entry.items.map((it: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-stone-400">•</span>
                                <span>{it.service_name}</span>
                                <span className="font-semibold text-amber-400">
                                  × {it.quantity} {it.unit}
                                </span>
                                <span className="text-stone-400">
                                  = {currency}{parseFloat(it.total_price).toFixed(0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {entry.notes && (
                          <div className="text-[11px] text-stone-500 mt-1 italic">
                            Note: {entry.notes}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-white">
                          {currency}{parseFloat(entry.total_amount).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-3">Record Received Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-xs text-stone-300 mb-1">Amount Received ({currency}) *</label>
                <input
                  type="number"
                  required
                  step="any"
                  placeholder="e.g. 500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <DatePicker
                  label="Payment Date"
                  value={paymentDate}
                  onChange={(val) => setPaymentDate(val)}
                  align="left"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-300 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="cash">Cash (રોકડા)</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-stone-300 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Collected by delivery boy"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-stone-950 font-bold text-xs"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">
                {editingId ? 'Edit Customer' : 'Add New Resident / Flat'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs text-stone-300 mb-1">Customer / Resident Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rameshbhai Patel"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-300 mb-1">Flat / Unit No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A/302 or 901"
                    value={formFlat}
                    onChange={(e) => setFormFlat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-300 mb-1">WhatsApp / Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98250 11223"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-300 mb-1">Society</label>
                  <select
                    value={formSocietyId}
                    onChange={(e) => {
                      setFormSocietyId(e.target.value);
                      setFormBlockId('');
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

                <div>
                  <label className="block text-xs text-stone-300 mb-1">Block / Wing</label>
                  <select
                    value={formBlockId}
                    onChange={(e) => setFormBlockId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Select Wing</option>
                    {modalBlocks.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-stone-300 mb-1">
                  Opening Balance ({currency})
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formOpeningBalance}
                  onChange={(e) => setFormOpeningBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400"
                >
                  Save Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
