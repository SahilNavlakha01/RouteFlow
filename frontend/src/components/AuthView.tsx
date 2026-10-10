'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Zap, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Lock, Mail, Building, Phone } from 'lucide-react';

export default function AuthView() {
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('laundry');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!email || !password || !businessName) {
          throw new Error('Please fill all required fields.');
        }
        await register({
          email,
          password,
          businessName,
          businessType,
          phone,
        });
      } else {
        if (!email || !password) {
          throw new Error('Please enter email and password.');
        }
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login('demo@routeflow.io', 'demo123');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center px-4 pt-16 pb-12 relative overflow-hidden">
      {/* Top Language Switcher Bar */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <div className="relative text-center mb-8 max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-4">
          <Zap className="w-3.5 h-3.5 fill-amber-400" />
          <span>{t('tagline')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Route<span className="text-amber-400">Flow</span>
        </h1>
        <p className="mt-2 text-stone-400 text-sm">
          Daily collection sheets, society customer ledgers & instant WhatsApp billing for neighborhood businesses.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md relative">
        <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-2xl border border-stone-800">
          
          {/* 1-Click Demo Shortcut */}
          <div className="mb-6 pb-6 border-b border-stone-800/80">
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full group relative flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent hover:from-amber-500/30 border border-amber-500/30 text-amber-300 transition-all text-left"
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('instantPreview')}
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  {t('demoLoginText')}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex rounded-xl bg-stone-900/80 p-1 mb-6 border border-stone-800">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isRegister ? 'bg-amber-500 text-stone-950 shadow-md font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              {t('signIn')}
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isRegister ? 'bg-amber-500 text-stone-950 shadow-md font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              {t('registerNew')}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Business / Shop Name *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Radhe Cleaners, Tasty Tiffin Hub"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-amber-400 placeholder:text-stone-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Business Category
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-amber-400"
                  >
                    <option value="laundry">🧺 Laundry & Ironing (ઇસ્ત્રી / ધોલાઈ)</option>
                    <option value="tiffin">🍱 Tiffin & Meals Service (ટિફિન સર્વિસ)</option>
                    <option value="grocery">🥛 Grocery, Milk & Dairy (દૂધ / કરિયાણું)</option>
                    <option value="other">📦 Other Daily Route Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    WhatsApp / Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-amber-400 placeholder:text-stone-600"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="yourname@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-amber-400 placeholder:text-stone-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-white text-sm focus:outline-none focus:border-amber-400 placeholder:text-stone-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Create Account & Get Started' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Micro Benefits Footer */}
          <div className="mt-6 pt-5 border-t border-stone-800/60 flex items-center justify-center gap-4 text-[11px] text-stone-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Auto-Catalog Seed
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Bills
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Offline Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
