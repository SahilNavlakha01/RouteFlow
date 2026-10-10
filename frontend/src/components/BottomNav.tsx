'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LayoutDashboard, Zap, Users, Layers, FileText } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Route Entry placed in the EXACT CENTER (Item 3 of 5)
  const links = [
    { href: '/', label: t('navOverview'), icon: LayoutDashboard },
    { href: '/customers', label: t('navCustomers'), icon: Users },
    { href: '/route', label: t('navRoute'), icon: Zap, hero: true },
    { href: '/services', label: t('navServices'), icon: Layers },
    { href: '/invoices', label: t('navBilling'), icon: FileText },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-950/95 backdrop-blur-2xl border-t border-stone-800/80 px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          if (link.hero) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative -top-4 flex flex-col items-center"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-amber-400 text-stone-950 shadow-amber-500/50 ring-4 ring-stone-950'
                      : 'bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 shadow-amber-500/30 ring-4 ring-stone-950'
                  }`}
                  style={{ width: '56px', height: '56px' }}
                >
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-amber-400 mt-0.5 truncate max-w-[68px] text-center">
                  {link.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-amber-400 font-semibold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-stone-400'}`} />
              <span className="text-[10px] mt-0.5 truncate max-w-[62px] text-center">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
