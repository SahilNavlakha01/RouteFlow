'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  Zap,
  LayoutDashboard,
  Users,
  Layers,
  FileText,
  MapPin,
  LogOut,
  Download,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      setInstallPrompt(null);
    }
  };

  const navLinks = [
    { href: '/', label: t('navOverview'), icon: LayoutDashboard },
    { href: '/route', label: t('navRoute'), icon: Zap, highlight: true },
    { href: '/customers', label: t('navCustomers'), icon: Users },
    { href: '/services', label: t('navServices'), icon: Layers },
    { href: '/locations', label: t('navSocieties'), icon: MapPin },
    { href: '/invoices', label: t('navBilling'), icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-stone-950/80 border-b border-stone-800/60 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-stone-950 fill-stone-950" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight text-white flex items-center gap-1.5">
                RouteFlow
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PWA
                </span>
              </span>
              <span className="block text-[11px] text-stone-400 font-medium">
                {t('tagline')}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-stone-800/80">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 shadow-sm border border-amber-500/30'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
                  } ${link.highlight && !isActive ? 'text-amber-400/90' : ''}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : ''}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action / Language / Profile */}
        <div className="flex items-center gap-2.5">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {installPrompt && (
            <button
              onClick={handleInstallClick}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-semibold text-xs hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20 animate-pulse"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('installApp')}</span>
            </button>
          )}

          {user && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-stone-800/60">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-stone-200 truncate max-w-[130px]">
                  {user.business_name}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                  {user.business_type}
                </span>
              </div>

              <button
                onClick={logout}
                title={t('logout')}
                className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
