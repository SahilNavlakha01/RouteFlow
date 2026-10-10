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
  X,
  Share,
  PlusSquare,
  Smartphone,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in installed standalone mode
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    }

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
      installPrompt.userChoice.then(() => {
        setInstallPrompt(null);
      });
    } else {
      setShowInstallGuide(true);
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
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-stone-950/90 border-b border-stone-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-stone-950 fill-stone-950" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
                    RouteFlow
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                    PWA
                  </span>
                </div>
                <span className="hidden sm:block text-[11px] text-stone-400 font-medium truncate">
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

          {/* Right Action / Language / Install / Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Install Button (Visible on both Mobile and Desktop when not already installed) */}
            {!isStandalone && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-amber-400 text-stone-950 font-bold text-[11px] sm:text-xs hover:bg-amber-300 transition-colors shadow-sm shadow-amber-500/20 active:scale-95"
                title={t('installApp')}
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden xs:inline">{t('installApp')}</span>
              </button>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User & Logout */}
            {user && (
              <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-stone-800/60">
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
                  type="button"
                  onClick={logout}
                  title={t('logout')}
                  className="p-1.5 sm:p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* PWA Install Guide Modal (Shown if user clicks install and browser requires manual step) */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-800 p-5 shadow-2xl relative">
            <button
              onClick={() => setShowInstallGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-400/20">
                <Smartphone className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install RouteFlow App</h3>
                <p className="text-xs text-stone-400">Save to your phone home screen</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-stone-300 bg-stone-950/50 p-3.5 rounded-2xl border border-stone-800/80">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                  1
                </div>
                <div>
                  <span className="font-bold text-white">Android Chrome:</span>
                  <p className="text-stone-400 mt-0.5">
                    Tap the 3 dots menu <span className="font-bold text-white">⋮</span> in top right, then select <span className="text-amber-400 font-semibold">&ldquo;Install App&rdquo;</span> or <span className="text-amber-400 font-semibold">&ldquo;Add to Home Screen&rdquo;</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-stone-800/60">
                <div className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                  2
                </div>
                <div>
                  <span className="font-bold text-white">iPhone Safari:</span>
                  <p className="text-stone-400 mt-0.5">
                    Tap the Share button <span className="text-amber-400 font-bold">⎋</span> at bottom of Safari, then choose <span className="text-amber-400 font-semibold">&ldquo;Add to Home Screen&rdquo;</span>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs hover:bg-amber-300 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
