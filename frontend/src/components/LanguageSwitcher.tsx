'use client';

import React from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const options: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'gu', label: 'ગુજરાતી' },
    { code: 'hi', label: 'हिन्दी' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-900 border border-stone-800">
      <Globe className="w-3.5 h-3.5 text-stone-400 ml-1.5 hidden sm:inline" />
      {options.map((opt) => (
        <button
          key={opt.code}
          type="button"
          onClick={() => setLanguage(opt.code)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            language === opt.code
              ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
