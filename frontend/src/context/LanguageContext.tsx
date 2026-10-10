'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'gu' | 'hi';

export interface Translations {
  [key: string]: {
    en: string;
    gu: string;
    hi: string;
  };
}

export const translations: Translations = {
  // Brand & Nav
  appName: { en: 'RouteFlow', gu: 'રૂટફ્લો (RouteFlow)', hi: 'रूटफ्लो (RouteFlow)' },
  tagline: { en: 'Neighborhood Micro-ERP', gu: 'લોકલ બિઝનેસ ખાતાવહી', hi: 'स्थानीय व्यापार बहीखाता' },
  navOverview: { en: 'Overview', gu: 'ડેશબોર્ડ', hi: 'डैशबोर्ड' },
  navRoute: { en: 'Route Entry', gu: 'દૈનિક રૂટ એન્ટ્રી', hi: 'दैनिक रूट एंट्री' },
  navCustomers: { en: 'Customers', gu: 'ગ્રાહકો & ફ્લેટ્સ', hi: 'ग्राहक और फ्लैट्स' },
  navServices: { en: 'Services', gu: 'સેવાઓ & રેટ', hi: 'सेवाएं और दरें' },
  navSocieties: { en: 'Societies', gu: 'સોસાયટીઓ', hi: 'सोसायटियां' },
  navBilling: { en: 'Billing & PDF', gu: 'બિલિંગ & PDF', hi: 'बिलिंग और पीडीएफ' },
  installApp: { en: 'Install App', gu: 'એપ ઇન્સ્ટોલ કરો', hi: 'ऐप इंस्टॉल करें' },
  logout: { en: 'Log Out', gu: 'લૉગ આઉટ', hi: 'लॉग आउट' },

  // Dashboard
  todayRoute: { en: "Today's Daily Route", gu: 'આજનો દૈનિક રૂટ', hi: 'आज का दैनिक रूट' },
  startRoute: { en: "Start Today's Route", gu: 'આજનો રૂટ શરૂ કરો', hi: 'आज का रूट शुरू करें' },
  generateBills: { en: 'Generate Bills', gu: 'બિલ જનરેટ કરો', hi: 'बिल तैयार करें' },
  todayBilled: { en: "Today's Billed", gu: 'આજનું કલેક્શન બિલ', hi: 'आज का कुल बिल' },
  flatsRecordedToday: { en: 'flats recorded today', gu: 'ફ્લેટ્સની આજે એન્ટ્રી થઈ', hi: 'फ्लैट्स की आज एंट्री हुई' },
  piecesCollected: { en: 'Pieces Collected', gu: 'કલેક્શન કરેલા પીસ/નંગ', hi: 'कलेक्ट किए गए कपड़े/आइटम' },
  thisMonth: { en: 'This month', gu: 'આ મહિને', hi: 'इस महीने' },
  pendingDues: { en: 'Pending Dues', gu: 'માર્કેટમાં બાકી લેણાં', hi: 'कुल बाकी बकाया' },
  viewLedgers: { en: 'View Customer Ledgers', gu: 'ગ્રાહક ખાતાવહી જુઓ', hi: 'ग्राहक बहीखाता देखें' },
  activeNetwork: { en: 'Active Network', gu: 'સક્રિય ગ્રાહકો', hi: 'सक्रिय ग्राहक' },
  societiesMapped: { en: 'societies mapped', gu: 'સોસાયટીઓ જોડાયેલ', hi: 'सोसायटियां जुड़ी हुई' },
  recentEntries: { en: 'Recent Daily Entries', gu: 'તાજેતરની દૈનિક એન્ટ્રીઓ', hi: 'हालिया दैनिक प्रविष्टियां' },
  recentSubtitle: { en: 'Last customer pickups and service entries', gu: 'છેલ્લા કસ્ટમર પિકઅપ્સ અને સર્વિસ હિસ્ટ્રી', hi: 'हालिया पिकअप और सेवा प्रविष्टियां' },
  viewRoute: { en: 'View Route', gu: 'રૂટ જુઓ', hi: 'रूट देखें' },
  quickActions: { en: 'Quick Actions', gu: 'ઝડપી વિકલ્પો', hi: 'त्वरित विकल्प' },
  activeCatalog: { en: 'Active Catalog', gu: 'ચાલુ સર્વિસ લિસ્ટ', hi: 'सक्रिय सेवा सूची' },
  addEditServices: { en: 'Add / Edit Services', gu: 'સર્વિસ ઉમેરો / સુધારો', hi: 'सेवा जोड़ें / बदलें' },

  // Route Entry
  fastRoute: { en: 'Fast Collection Route', gu: 'ઝડપી કલેક્શન રૂટ', hi: 'त्वरित कलेक्शन रूट' },
  dailyDoorstepLedger: { en: 'Daily Doorstep Ledger', gu: 'દૈનિક ડોરસ્ટેપ ખાતાવહી', hi: 'दैनिक डोरस्टेप बहीखाता' },
  today: { en: 'Today', gu: 'આજે', hi: 'आज' },
  yesterday: { en: 'Yesterday', gu: 'ગઈકાલે', hi: 'कल' },
  selectSociety: { en: 'Select Society / Apartment', gu: 'સોસાયટી / એપાર્ટમેન્ટ પસંદ કરો', hi: 'सोसाइटी / अपार्टमेंट चुनें' },
  allSocieties: { en: 'All Societies', gu: 'બધી સોસાયટીઓ', hi: 'सभी सोसायटियां' },
  allWings: { en: 'All Wings', gu: 'બધા બ્લોક્સ/વિંગ', hi: 'सभी विंग्स' },
  routeProgress: { en: 'Route Progress', gu: 'રૂટ પ્રગતિ', hi: 'रूट प्रगति' },
  flatsRecorded: { en: 'flats recorded', gu: 'ફ્લેટ્સ નોંધાયા', hi: 'फ्लैट्स दर्ज' },
  addNewFlat: { en: '+ Add New Flat', gu: '+ નવો ફ્લેટ ઉમેરો', hi: '+ नया फ्लैट जोड़ें' },
  tapToRecord: { en: 'Tap to record pickup', gu: 'કલેક્શન નોંધવા ટેપ કરો', hi: 'पिकअप दर्ज करने टैप करें' },
  selectServicesAndQty: { en: 'Select Services & Quantities', gu: 'સેવાઓ અને સંખ્યા પસંદ કરો', hi: 'सेवाएं और मात्रा चुनें' },
  entryStatus: { en: 'Entry Status', gu: 'સ્ટેટસ', hi: 'स्थिति' },
  instantPaid: { en: 'Instant Cash / UPI Paid', gu: 'રોકડા / UPI ચૂકવ્યા', hi: 'नकद / UPI प्राप्त' },
  notesRemarks: { en: 'Item Notes / Remarks', gu: 'નોંધ / વિગત (કાપડ/ટિફિન)', hi: 'नोट / विवरण' },
  saveEntry: { en: 'Save Entry', gu: 'એન્ટ્રી સેવ કરો', hi: 'एंट्री सहेजें' },
  saved: { en: 'Saved!', gu: 'સેવ થઈ ગયું!', hi: 'सहेज लिया गया!' },
  itemsSelected: { en: 'items selected', gu: 'નંગ પસંદ કર્યા', hi: 'आइटम चुने गए' },

  // Statuses
  collected: { en: 'Collected', gu: 'કલેક્શન કર્યું', hi: 'कलेक्ट किया' },
  in_process: { en: 'In Process', gu: 'તૈયાર થાય છે', hi: 'प्रोसेस में' },
  delivered: { en: 'Delivered', gu: 'આપી દીધું', hi: 'डिलीवर किया' },
  due: { en: 'Due', gu: 'બાકી', hi: 'बाकी' },
  clear: { en: 'Clear', gu: 'ચૂકતે', hi: 'बेबाक' },

  // Customers & Ledger
  customerDirectory: { en: 'Customer & Flats Directory', gu: 'ગ્રાહક અને ફ્લેટ ડિરેક્ટરી', hi: 'ग्राहक और फ्लैट डायरेक्टरी' },
  addResident: { en: 'Add Resident / Customer', gu: 'નવો રેસિડેન્ટ ઉમેરો', hi: 'नया निवासी जोड़ें' },
  searchPlaceholder: { en: 'Search by Flat, Customer Name, or Phone...', gu: 'ફ્લેટ, નામ અથવા ફોન નંબરથી શોધો...', hi: 'फ्लैट, नाम या फोन नंबर से खोजें...' },
  currentBalance: { en: 'Current Balance', gu: 'વર્તમાન બાકી રકમ', hi: 'वर्तमान बकाया राशि' },
  ledger: { en: 'Ledger', gu: 'ખાતાવહી', hi: 'बहीखाता' },
  totalBilled: { en: 'Total Billed', gu: 'કુલ બિલ થયેલ', hi: 'कुल बिल हुआ' },
  totalPaid: { en: 'Total Paid', gu: 'કુલ જમા થયેલ', hi: 'कुल प्राप्त हुआ' },
  netDueBalance: { en: 'Net Due Balance', gu: 'કુલ બાકી નીકળતી રકમ', hi: 'कुल बकाया राशि' },
  recordPayment: { en: '+ Record Payment', gu: '+ જમા નોંધો', hi: '+ भुगतान दर्ज करें' },
  billPdf: { en: 'Bill / PDF', gu: 'બિલ / PDF', hi: 'बिल / पीडीएफ' },
  savePayment: { en: 'Save Payment', gu: 'પેમેન્ટ સેવ કરો', hi: 'भुगतान सहेजें' },
  paymentMode: { en: 'Payment Mode', gu: 'ચુકવણીની રીત', hi: 'भुगतान का प्रकार' },
  cash: { en: 'Cash (રોકડા)', gu: 'રોકડા (Cash)', hi: 'नकद (Cash)' },
  upi: { en: 'UPI / GPay / PhonePe', gu: 'UPI / GPay / PhonePe', hi: 'UPI / GPay / PhonePe' },
  bank: { en: 'Bank Transfer', gu: 'બેંક ટ્રાન્સફર', hi: 'बैंक ट्रांसफर' },

  // Billing & Statements
  statementTitle: { en: 'Customer Invoicing & PDF Statements', gu: 'ગ્રાહક બિલિંગ & PDF સ્ટેટમેન્ટ', hi: 'ग्राहक बिलिंग और पीडीएफ विवरण' },
  printSavePdf: { en: 'Print / Save PDF', gu: 'પ્રિન્ટ / PDF ડાઉનલોડ', hi: 'प्रिंट / PDF डाउनलोड' },
  shareWhatsApp: { en: 'Share WhatsApp', gu: 'WhatsApp પર મોકલો', hi: 'WhatsApp पर भेजें' },
  selectResident: { en: 'Select Resident / Flat', gu: 'રેસિડેન્ટ / ફ્લેટ પસંદ કરો', hi: 'निवासी / फ्लैट चुनें' },
  fromDate: { en: 'From Date', gu: 'તારીખથી', hi: 'प्रारंभिक तिथि' },
  toDate: { en: 'To Date', gu: 'તારીખ સુધી', hi: 'अंतिम तिथि' },
  statementHeader: { en: 'STATEMENT OF ACCOUNT', gu: 'ખાતાનું સ્ટેટમેન્ટ (હિસાબ)', hi: 'खाता विवरण (हिसाब)' },
  billToResident: { en: 'Bill To Resident', gu: 'બિલ મેળવનાર ગ્રાહક', hi: 'बिल प्राप्तकर्ता' },
  totalPayable: { en: 'Total Payable Balance', gu: 'કુલ ચૂકવવાપાત્ર રકમ', hi: 'कुल देय राशि' },
  itemizedLog: { en: 'Itemized Daily Log', gu: 'દૈનિક વિગતવાર લૉગ', hi: 'दैनिक विस्तृत लॉग' },
  date: { en: 'Date', gu: 'તારીખ', hi: 'तारीख' },
  servicesItems: { en: 'Services / Items', gu: 'સેવાઓ / આઇટમ્સ', hi: 'सेवाएं / वस्तुएं' },
  qty: { en: 'Qty', gu: 'સંખ્યા', hi: 'मात्रा' },
  amount: { en: 'Amount', gu: 'રકમ', hi: 'रकम' },
  previousBalance: { en: 'Previous Balance:', gu: 'પાછલી બાકી રકમ:', hi: 'पिछला बकाया:' },
  currentCharges: { en: 'Current Period Charges:', gu: 'આ સમયનું બિલ:', hi: 'इस अवधि का बिल:' },
  paymentsReceived: { en: 'Payments Received:', gu: 'જમા થયેલ રકમ:', hi: 'प्राप्त भुगतान:' },
  totalAmountDue: { en: 'Total Amount Due:', gu: 'કુલ બાકી રકમ:', hi: 'कुल देय राशि:' },

  // Auth
  instantPreview: { en: 'Instant Preview', gu: 'તુરંત ૧-ક્લિક પ્રિવ્યૂ', hi: 'तुरंत 1-क्लिक प्रीव्यू' },
  demoLoginText: { en: 'Log in as Demo Business (Laundry & Dry Clean)', gu: 'ડેમો બિઝનેસ તરીકે લૉગિન કરો (લૉન્ડ્રી & ઇસ્ત્રી)', hi: 'डेमो व्यवसाय से लॉगिन करें (लॉन्ड्री व ड्राईक्लीन)' },
  signIn: { en: 'Sign In', gu: 'સાઇન ઇન', hi: 'साइन इन' },
  registerNew: { en: 'Register New Business', gu: 'નવો બિઝનેસ રજીસ્ટર કરો', hi: 'नया व्यवसाय रजिस्टर करें' },
  businessName: { en: 'Business / Shop Name *', gu: 'દુકાન / બિઝનેસનું નામ *', hi: 'दुकान / व्यवसाय का नाम *' },
  businessCategory: { en: 'Business Category', gu: 'બિઝનેસ કેટેગરી', hi: 'व्यवसाय की श्रेणी' },
  emailAddress: { en: 'Email Address *', gu: 'ઇમેઇલ એડ્રેસ *', hi: 'ईमेल एड्रेस *' },
  password: { en: 'Password *', gu: 'પાસવર્ડ *', hi: 'पासवर्ड *' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('routeflow_lang') as Language;
    if (saved && (saved === 'en' || saved === 'gu' || saved === 'hi')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('routeflow_lang', lang);
    }
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
