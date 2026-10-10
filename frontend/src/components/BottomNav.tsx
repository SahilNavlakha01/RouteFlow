'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LayoutDashboard, Zap, Users, Layers, FileText } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Exactly 5 links: Item 3 is Center Hero Button (Route Entry)
  const links = [
    { href: '/', label: t('navOverview'), icon: LayoutDashboard },
    { href: '/customers', label: t('navCustomers'), icon: Users },
    { href: '/route', label: t('navRoute'), icon: Zap, hero: true },
    { href: '/services', label: t('navServices'), icon: Layers },
    { href: '/invoices', label: t('navBilling'), icon: FileText },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-2xl border-t border-stone-800/80 px-1 pt-1 pb-[max(0.65rem,env(safe-area-inset-bottom))] overflow-hidden select-none shadow-[0_-8px_20px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-5 items-end max-w-md mx-auto w-full">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          if (link.hero) {
            return (
              <div key={link.href} className="flex flex-col items-center justify-end">
                <Link
                  href={link.href}
                  className="relative -top-3 flex flex-col items-center group active:scale-95 transition-transform"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                      isActive
                        ? 'bg-amber-400 text-stone-950 shadow-amber-500/50 ring-4 ring-stone-950'
                        : 'bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 shadow-amber-500/30 ring-4 ring-stone-950'
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 mt-0.5 truncate w-full text-center">
                    {link.label}
                  </span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isActive ? 'text-amber-400 font-semibold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
              <span className="text-[10px] mt-0.5 truncate w-full text-center px-0.5">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
