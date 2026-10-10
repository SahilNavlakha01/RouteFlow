'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AuthView from '@/components/AuthView';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import DatePicker from '@/components/DatePicker';
import { api } from '@/lib/api';
import {
  FileText,
  Printer,
  Share2,
  Calendar,
  Building,
  User,
  Phone,
  CheckCircle2,
  Download,
  CreditCard,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

function InvoicesContent() {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const preselectedCustId = searchParams.get('customer_id');

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustId || '');
  
  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = today.substring(0, 7) + '-01';
    setStartDate(firstDayOfMonth);
    setEndDate(today);
  }, []);

  // Statement data
  const [statement, setStatement] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Load customer list
  useEffect(() => {
    if (user) {
      api.getCustomers().then((res) => {
        if (res?.customers) {
          setCustomers(res.customers);
          if (!selectedCustomerId && res.customers.length > 0) {
            setSelectedCustomerId(String(res.customers[0].id));
          }
        }
      });
    }
  }, [user]);

  // Load statement whenever customer or date range changes
  const fetchStatement = async () => {
    if (!selectedCustomerId) return;
    setLoading(true);
    try {
      const res = await api.getStatement({
        customer_id: Number(selectedCustomerId),
        start_date: startDate,
        end_date: endDate,
      });
      if (res?.statement) {
        setStatement(res.statement);
      }
    } catch (err) {
      console.error('Statement error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCustomerId) {
      fetchStatement();
    }
  }, [selectedCustomerId, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    if (!statement || !statement.customer) return;
    const cust = statement.customer;
    const phone = cust.phone ? cust.phone.replace(/[^0-9]/g, '') : '';
    const currency = user?.currency || '₹';

    let headerMsg = `🧾 *${statement.business.business_name}* - Bill Statement`;
    let greeting = `Hello ${cust.name},\nHere is your service summary for Flat *${cust.unit_number}*, ${cust.society_name || ''}.`;
    let periodLbl = `📅 Period`;
    let prevLbl = `Previous Balance`;
    let chgLbl = `Period Charges`;
    let paidLbl = `Paid Amount`;
    let dueLbl = `Total Due`;
    let thankYou = `Thank you for your business! 🙏`;

    if (language === 'gu') {
      headerMsg = `🧾 *${statement.business.business_name}* - હિસાબ / બિલ સ્ટેટમેન્ટ`;
      greeting = `નમસ્તે ${cust.name},\nતમારા ફ્લેટ *${cust.unit_number}* (${cust.society_name || ''}) નો સર્વિસ હિસાબ નીચે મુજબ છે:`;
      periodLbl = `📅 સમયગાળો`;
      prevLbl = `પાછલી બાકી રકમ`;
      chgLbl = `આ સમયનું બિલ`;
      paidLbl = `જમા થયેલ રકમ`;
      dueLbl = `કુલ ચૂકવવાપાત્ર રકમ`;
      thankYou = `આભાર! 🙏`;
    } else if (language === 'hi') {
      headerMsg = `🧾 *${statement.business.business_name}* - बिल विवरण`;
      greeting = `नमस्ते ${cust.name},\nआपके फ्लैट *${cust.unit_number}* (${cust.society_name || ''}) का सेवा विवरण नीचे है:`;
      periodLbl = `📅 अवधि`;
      prevLbl = `पिछला बकाया`;
      chgLbl = `इस अवधि का बिल`;
      paidLbl = `प्राप्त भुगतान`;
      dueLbl = `कुल देय राशि`;
      thankYou = `धन्यवाद! 🙏`;
    }

    const text = encodeURIComponent(
      `${headerMsg}\n\n` +
      `${greeting}\n\n` +
      `${periodLbl}: ${statement.start_date} to ${statement.end_date}\n` +
      `• ${prevLbl}: ${currency}${parseFloat(statement.previous_balance).toFixed(0)}\n` +
      `• ${chgLbl}: ${currency}${parseFloat(statement.period_billed).toFixed(0)}\n` +
      `• ${paidLbl}: ${currency}${parseFloat(statement.period_paid).toFixed(0)}\n` +
      `--------------------------------\n` +
      `*${dueLbl}: ${currency}${parseFloat(statement.net_payable).toFixed(0)}*\n\n` +
      `${thankYou}`
    );

    const waUrl = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
  };

  if (authLoading) return null;
  if (!user) return <AuthView />;

  const currency = user.currency || '₹';

  return (
    <div className="min-h-screen bg-stone-950 pb-24 md:pb-12 text-stone-100">
      <div className="no-print">
        <Navbar />
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print glass-panel rounded-2xl p-4 sm:p-5 border border-stone-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                {t('statementTitle')}
              </h1>
              <p className="text-xs text-stone-400 mt-0.5">
                Generate itemized monthly/weekly statements and share via WhatsApp or printable PDF.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={!statement}
                className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>{t('printSavePdf')}</span>
              </button>

              <button
                onClick={handleWhatsAppShare}
                disabled={!statement}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>{t('shareWhatsApp')}</span>
              </button>
            </div>
          </div>

          {/* Select Customer & Date Range Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-800/60">
            <div>
              <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                {t('selectResident')}
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.unit_number} — {c.name} ({c.society_name || 'Society'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <DatePicker
                label={t('fromDate')}
                value={startDate}
                onChange={(val) => setStartDate(val)}
                align="left"
              />
            </div>

            <div>
              <DatePicker
                label={t('toDate')}
                value={endDate}
                onChange={(val) => setEndDate(val)}
                align="right"
              />
            </div>
          </div>
        </div>

        {/* Printable Invoice Statement Container */}
        {loading ? (
          <div className="py-20 flex justify-center no-print">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !statement ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-stone-500 text-xs no-print">
            Please select a customer to display their invoice statement.
          </div>
        ) : (
          <div
            ref={invoiceRef}
            className="print-sheet bg-stone-900/90 text-stone-100 rounded-3xl p-6 sm:p-10 border border-stone-800 shadow-2xl space-y-6"
          >
            
            {/* Invoice Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-stone-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold mb-2 border border-amber-500/20">
                  {t('statementHeader')}
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  {statement.business?.business_name}
                </h2>
                <p className="text-xs text-stone-400 mt-1 max-w-sm">
                  {statement.business?.address || 'Local Neighborhood Service Partner'}
                </p>
                {statement.business?.phone && (
                  <p className="text-xs text-stone-400 mt-0.5">
                    Phone: {statement.business.phone}
                  </p>
                )}
              </div>

              {/* Bill Details */}
              <div className="sm:text-right space-y-1">
                <div className="text-xs text-stone-400">{t('date')}</div>
                <div className="text-sm font-bold text-white">
                  {new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <div className="text-xs text-stone-400 mt-2">Cycle</div>
                <div className="text-xs font-semibold text-amber-400">
                  {statement.start_date} to {statement.end_date}
                </div>
              </div>
            </div>

            {/* Resident Customer Information Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-950/70 border border-stone-800">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  {t('billToResident')}
                </div>
                <div className="text-base font-bold text-white">
                  {statement.customer?.name}
                </div>
                <div className="text-xs text-stone-300 mt-0.5">
                  Flat {statement.customer?.unit_number} • {statement.customer?.society_name}
                </div>
                {statement.customer?.phone && (
                  <div className="text-xs text-stone-400 mt-0.5">
                    Contact: {statement.customer.phone}
                  </div>
                )}
              </div>

              <div className="sm:text-right flex flex-col justify-center">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  {t('totalPayable')}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">
                  {currency}{parseFloat(statement.net_payable).toFixed(0)}
                </div>
              </div>
            </div>

            {/* Itemized Daily Pickups Table */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                {t('itemizedLog')}
              </div>

              {statement.entries?.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-500 italic bg-stone-950/40 rounded-xl">
                  No pickup entries during this selected date range.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-stone-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-950 text-stone-400 font-semibold border-b border-stone-800">
                      <tr>
                        <th className="py-3 px-4">{t('date')}</th>
                        <th className="py-3 px-4">{t('servicesItems')}</th>
                        <th className="py-3 px-4 text-center">{t('qty')}</th>
                        <th className="py-3 px-4 text-right">{t('amount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 bg-stone-950/40">
                      {statement.entries.map((entry: any) => (
                        <tr key={entry.id} className="hover:bg-stone-900/30">
                          <td className="py-3 px-4 font-medium text-stone-300 whitespace-nowrap">
                            {entry.entry_date?.substring(0, 10)}
                          </td>
                          <td className="py-3 px-4 text-white">
                            {entry.items && entry.items.length > 0 ? (
                              <div className="space-y-0.5">
                                {entry.items.map((it: any, idx: number) => (
                                  <div key={idx} className="text-stone-200">
                                    {it.service_name}{' '}
                                    <span className="text-stone-400">
                                      (@ {currency}{it.unit_price}/{it.unit})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span>Service Delivery</span>
                            )}
                            {entry.notes && (
                              <div className="text-[10px] text-stone-500 italic mt-0.5">
                                {entry.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-amber-400">
                            {entry.total_items}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white">
                            {currency}{parseFloat(entry.total_amount).toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Financial Ledger Calculation Summary */}
            <div className="flex flex-col sm:flex-row justify-end pt-2">
              <div className="w-full sm:w-72 space-y-2 text-xs bg-stone-950/70 p-4 rounded-2xl border border-stone-800">
                <div className="flex justify-between text-stone-400">
                  <span>{t('previousBalance')}</span>
                  <span className="text-white font-medium">
                    {currency}{parseFloat(statement.previous_balance).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>{t('currentCharges')}</span>
                  <span className="text-white font-medium">
                    {currency}{parseFloat(statement.period_billed).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>{t('paymentsReceived')}</span>
                  <span className="text-emerald-400 font-medium">
                    - {currency}{parseFloat(statement.period_paid).toFixed(0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-800 flex justify-between font-extrabold text-sm text-white">
                  <span>{t('totalAmountDue')}</span>
                  <span className="text-amber-400 text-base">
                    {currency}{parseFloat(statement.net_payable).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-4 border-t border-stone-800/60 text-center text-[11px] text-stone-500">
              Computer-generated ledger statement by {statement.business?.business_name}. Powered by RouteFlow.
            </div>

          </div>
        )}

      </main>

      <div className="no-print">
        <BottomNav />
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InvoicesContent />
    </Suspense>
  );
}
