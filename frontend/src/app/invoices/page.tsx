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

  if (!user) return null;

  const currency = user.currency || '₹';

  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6 print:max-w-none print:p-0 print:m-0 print:space-y-0">
        
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
        ) : (() => {
          // Prepare flattened line items for the accounting table
          const lineItems: Array<{
            id: string;
            dateStr: string;
            serviceName: string;
            qtyStr: string;
            rateStr: string;
            totalNum: number;
            totalStr: string;
            notes?: string;
          }> = [];

          let totalItemsCount = 0;

          const formatDateStr = (dStr?: string) => {
            if (!dStr) return '';
            const d = new Date(dStr);
            if (isNaN(d.getTime())) return dStr.substring(0, 10);
            return d.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
          };

          statement.entries?.forEach((entry: any, eIdx: number) => {
            const dateDisplay = formatDateStr(entry.entry_date);

            if (entry.items && entry.items.length > 0) {
              entry.items.forEach((it: any, iIdx: number) => {
                const q = parseFloat(it.quantity) || 0;
                totalItemsCount += q;
                const rate = parseFloat(it.unit_price) || 0;
                const tot = parseFloat(it.total_price) || q * rate;
                const qFormatted = `${Number.isInteger(q) ? q : q.toFixed(1)} ${it.unit || ''}`.trim();

                lineItems.push({
                  id: `${entry.id}-${iIdx}`,
                  dateStr: dateDisplay,
                  serviceName: it.service_name || 'Service Delivery',
                  qtyStr: qFormatted,
                  rateStr: rate > 0 ? `${currency}${rate.toFixed(2)}` : '-',
                  totalNum: tot,
                  totalStr: `${currency}${tot.toFixed(2)}`,
                  notes: iIdx === 0 ? entry.notes : undefined,
                });
              });
            } else {
              const q = parseFloat(entry.total_items) || 0;
              totalItemsCount += q;
              const tot = parseFloat(entry.total_amount) || 0;
              const rate = q > 0 ? tot / q : 0;
              lineItems.push({
                id: `entry-${entry.id}-${eIdx}`,
                dateStr: dateDisplay,
                serviceName: 'Service Delivery',
                qtyStr: `${Number.isInteger(q) ? q : q.toFixed(1)}`,
                rateStr: rate > 0 ? `${currency}${rate.toFixed(2)}` : '-',
                totalNum: tot,
                totalStr: `${currency}${tot.toFixed(2)}`,
                notes: entry.notes,
              });
            }
          });

          // Deduplicate "Block Block A"
          const blockRaw = statement.customer?.block_name ? statement.customer.block_name.trim() : '';
          const blockClean = blockRaw
            ? blockRaw.toLowerCase().startsWith('block')
              ? blockRaw
              : `Block ${blockRaw}`
            : '';
          const societyDisplay = statement.customer?.society_name
            ? `${statement.customer.society_name}${blockClean ? ` • ${blockClean}` : ''}`
            : blockClean || 'Apartment Complex';

          const invoiceNumber = `RF-${(statement.customer?.id || 1).toString().padStart(3, '0')}-${(statement.end_date || '').replace(/-/g, '').slice(2)}`;
          const isSettled = parseFloat(statement.net_payable) <= 0;

          return (
            <div
              ref={invoiceRef}
              className="print-sheet bg-white text-slate-900 rounded-2xl shadow-xl ring-1 ring-slate-200/80 p-6 sm:p-9 space-y-4 print:p-0 print:shadow-none print:rounded-none print:ring-0 print:space-y-3.5 print:max-h-full"
            >
              {/* Sleek Top Accent Header Ribbon */}
              <div className="h-1.5 w-full bg-gradient-to-r from-slate-900 via-amber-500 to-slate-900 rounded-full mb-3 print:rounded-none" />

              {/* Corporate Header: Brand & Document Meta */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3.5 border-b-2 border-slate-900">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-black text-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-800">
                      {statement.business?.business_name ? statement.business.business_name.charAt(0).toUpperCase() : 'R'}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 leading-none">
                        {statement.business?.business_name || 'RouteFlow Partner'}
                      </h2>
                      <div className="mt-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                          {statement.business?.business_type || 'Daily Doorstep Route Ledger'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 mt-2 space-y-0.5 print:text-[10px]">
                    {statement.business?.address && (
                      <p className="flex items-center gap-1.5 font-medium">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{statement.business.address}</span>
                      </p>
                    )}
                    {statement.business?.phone && (
                      <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Helpline / Mobile: {statement.business.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Document Metadata Box */}
                <div className="sm:text-right space-y-1">
                  <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
                    {t('statementHeader')}
                  </div>

                  <div className="inline-block bg-slate-50 border border-slate-200 rounded-lg p-2 text-left sm:text-right space-y-0.5 text-xs print:text-[10px]">
                    <div className="text-slate-500">
                      Statement #: <span className="font-extrabold text-slate-900">{invoiceNumber}</span>
                    </div>
                    <div className="text-slate-500">
                      Issued Date:{' '}
                      <span className="font-semibold text-slate-900">
                        {new Date().toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Cycle:{' '}
                      <span className="font-bold text-slate-900">
                        {formatDateStr(statement.start_date)} – {formatDateStr(statement.end_date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer & Due Summary Banner (Unified Executive Box) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {t('billToResident')}
                  </div>
                  <div className="text-lg font-black text-slate-950 flex items-center gap-2 flex-wrap">
                    <span>{statement.customer?.name}</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-stone-950 font-black text-xs shadow-xs">
                      {statement.customer?.unit_number ? `Flat ${statement.customer.unit_number}` : 'Resident'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 font-semibold print:text-[11px]">
                    {societyDisplay}
                  </div>
                  {statement.customer?.phone && (
                    <div className="text-xs text-slate-600 print:text-[10px] flex items-center gap-1 font-medium">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Contact: {statement.customer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Right Callout Badge for Amount Due */}
                <div className="p-3 rounded-xl bg-white border border-slate-300 flex flex-col items-start sm:items-end min-w-[210px] shadow-xs">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    {t('totalPayable')}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    {currency}{parseFloat(statement.net_payable).toFixed(0)}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isSettled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {isSettled ? 'Settled / Nil Balance' : 'Payment Due'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Accounting Table */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>{t('itemizedLog')}</span>
                    <span className="text-slate-500 font-normal">
                      ({lineItems.length} {lineItems.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                </div>

                {lineItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 italic bg-slate-50 rounded-xl border border-slate-200">
                    No pickup or delivery entries recorded during this billing cycle.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-300">
                    <table className="w-full text-left text-xs print:text-[11px] border-collapse">
                      <thead className="bg-slate-900 text-white font-extrabold border-b border-slate-900">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center font-bold">#</th>
                          <th className="py-2.5 px-3 w-28 font-bold whitespace-nowrap">{t('date')}</th>
                          <th className="py-2.5 px-3 font-bold">{t('servicesItems')}</th>
                          <th className="py-2.5 px-3 text-center w-24 font-bold">{t('qty')}</th>
                          <th className="py-2.5 px-3 text-right w-24 font-bold">Rate</th>
                          <th className="py-2.5 px-3 text-right w-24 font-bold">{t('amount')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {lineItems.map((item, index) => (
                          <tr
                            key={item.id}
                            className={index % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                          >
                            <td className="py-2 px-3 text-center text-slate-500 font-medium">
                              {index + 1}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">
                              {item.dateStr}
                            </td>
                            <td className="py-2 px-3 text-slate-900">
                              <span className="font-bold text-slate-950">{item.serviceName}</span>
                              {item.notes && (
                                <div className="text-[10px] text-slate-500 italic mt-0.5">
                                  Note: {item.notes}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-900 whitespace-nowrap">
                              {item.qtyStr}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                              {item.rateStr}
                            </td>
                            <td className="py-2 px-3 text-right font-black text-slate-950 whitespace-nowrap">
                              {item.totalStr}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Subtotal Footer Row */}
                      <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                        <tr>
                          <td colSpan={3} className="py-2 px-3 font-extrabold uppercase text-[10px] text-slate-600">
                            Total Deliveries / Cycle Summary
                          </td>
                          <td className="py-2 px-3 text-center font-extrabold text-slate-900">
                            {Number.isInteger(totalItemsCount) ? totalItemsCount : totalItemsCount.toFixed(1)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500 text-[10px]">
                            Cycle Charges
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-950">
                            {currency}{parseFloat(statement.period_billed).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Financial Ledger Calculation & Payment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 print:gap-3">
                {/* Payment Methods & Signatory Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs print:text-[10px] space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="font-black uppercase tracking-wider text-slate-700 text-[10px]">
                      Payment Methods & Instructions
                    </div>
                    <p className="text-slate-800 mt-1 font-medium">
                      Payments accepted via <strong>Cash</strong>, <strong>UPI (GPay / PhonePe / Paytm)</strong>, or Direct Bank Transfer.
                    </p>
                    <p className="text-slate-600 mt-1 italic text-[11px] print:text-[10px]">
                      Thank you for your prompt settlement! Please clear outstanding dues within 7 days.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex items-end justify-between text-[11px] print:text-[10px]">
                    <span className="text-slate-600 font-medium">
                      For {statement.business?.business_name || 'Business'}
                    </span>
                    <div className="text-right">
                      <div className="h-6" />
                      <span className="font-bold text-slate-800 border-t border-slate-400 pt-0.5 inline-block">
                        Authorized Signatory
                      </span>
                    </div>
                  </div>
                </div>

                {/* Formal Accounting Ledger Summary */}
                <div className="space-y-1.5 text-xs print:text-[11px] bg-slate-50 p-3.5 rounded-xl border border-slate-300">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>{t('previousBalance')}</span>
                    <span className="text-slate-900 font-bold">
                      {currency}{parseFloat(statement.previous_balance).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>{t('currentCharges')}</span>
                    <span className="text-slate-900 font-bold">
                      + {currency}{parseFloat(statement.period_billed).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>{t('paymentsReceived')}</span>
                    <span className="text-emerald-700 font-bold">
                      - {currency}{parseFloat(statement.period_paid).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t-2 border-slate-900 flex justify-between items-center bg-slate-900 text-white p-2.5 rounded-lg">
                    <span className="font-black uppercase text-xs tracking-wider">{t('totalAmountDue')}</span>
                    <span className="font-black text-base text-amber-400">
                      {currency}{parseFloat(statement.net_payable).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Authenticity Footer Note */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>
                  Computer-generated tax invoice & statement by {statement.business?.business_name}. Powered by RouteFlow.
                </span>
                <span className="font-bold text-slate-700">
                  Page 1 of 1
                </span>
              </div>
            </div>
          );
        })()}

      </main>
    </>
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
