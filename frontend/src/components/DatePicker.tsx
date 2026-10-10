'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface DatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right';
  showPresets?: boolean;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_GU = [
  'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
  'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
];

const MONTH_NAMES_HI = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
];

const DAYS_SHORT_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAYS_SHORT_GU = ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'];
const DAYS_SHORT_HI = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  className = '',
  align = 'left',
  showPresets = true,
  minDate,
  maxDate,
  disabled = false,
}: DatePickerProps) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or fallback to today
  const parseDate = (str: string) => {
    if (!str) return null;
    const parts = str.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return null;
  };

  const selectedDate = parseDate(value);
  const today = new Date();

  // Navigation state (viewed month and year)
  const [viewYear, setViewYear] = useState(() => selectedDate ? selectedDate.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate ? selectedDate.getMonth() : today.getMonth());
  const [showYearSelector, setShowYearSelector] = useState(false);

  // Sync viewed month/year when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowYearSelector(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const monthNames = language === 'gu' ? MONTH_NAMES_GU : language === 'hi' ? MONTH_NAMES_HI : MONTH_NAMES_EN;
  const daysShort = language === 'gu' ? DAYS_SHORT_GU : language === 'hi' ? DAYS_SHORT_HI : DAYS_SHORT_EN;

  const formatDateString = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formatted = formatDateString(viewYear, viewMonth, day);
    onChange(formatted);
    setIsOpen(false);
    setShowYearSelector(false);
  };

  const handlePresetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const formatted = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
    onChange(formatted);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handlePresetYesterday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const formatted = formatDateString(yest.getFullYear(), yest.getMonth(), yest.getDate());
    onChange(formatted);
    setViewYear(yest.getFullYear());
    setViewMonth(yest.getMonth());
    setIsOpen(false);
  };

  const handlePresetMonthStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const formatted = formatDateString(viewYear, viewMonth, 1);
    onChange(formatted);
    setIsOpen(false);
  };

  // Calendar matrix calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Days from previous month to fill the first row
  const prevMonthDays: number[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  // Days in current month
  const currentMonthDays: number[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  // Total grid slots usually 35 or 42
  const totalSlots = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalSlots <= 35 ? 35 - totalSlots : 42 - totalSlots;
  const nextMonthDays: number[] = [];
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    nextMonthDays.push(i);
  }

  // Display label formatting
  const getDisplayValue = () => {
    if (!selectedDate) return placeholder;
    const day = selectedDate.getDate();
    const month = monthNames[selectedDate.getMonth()].slice(0, 3);
    const year = selectedDate.getFullYear();

    // Check if it's today or yesterday
    const isToday =
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate();

    if (isToday) {
      return `${t('today')} (${day} ${month})`;
    }

    return `${day} ${month} ${year}`;
  };

  // Available years for fast selector
  const currentYear = today.getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - 7 + i);

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold text-stone-300 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-stone-900 border text-left transition-all text-xs ${
          isOpen
            ? 'border-amber-400 ring-2 ring-amber-400/20 text-white'
            : 'border-stone-800 text-stone-200 hover:border-stone-700 hover:bg-stone-850'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-medium truncate">{getDisplayValue()}</span>
        </div>
        <span className="text-[10px] text-stone-500 font-mono shrink-0">
          {value || 'YYYY-MM-DD'}
        </span>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-72 sm:w-80 rounded-2xl bg-stone-900 border border-stone-800 shadow-2xl p-3 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ maxWidth: 'calc(100vw - 2rem)' }}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowYearSelector(!showYearSelector)}
              className="px-2 py-1 rounded-lg text-xs font-bold text-white hover:bg-stone-800 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <span>{monthNames[viewMonth]}</span>
              <span className="text-amber-400">{viewYear}</span>
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Fast Year/Month Picker Grid */}
          {showYearSelector ? (
            <div className="py-2">
              <div className="text-[11px] font-semibold text-stone-400 mb-2 px-1">
                Select Year
              </div>
              <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewYear(y);
                      setShowYearSelector(false);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      y === viewYear
                        ? 'bg-amber-400 text-stone-950 font-bold'
                        : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {daysShort.map((d, idx) => (
                  <div
                    key={idx}
                    className="text-[10px] font-semibold text-stone-500 py-0.5 uppercase"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Previous Month trailing days */}
                {prevMonthDays.map((d, idx) => (
                  <button
                    key={`prev-${idx}`}
                    type="button"
                    onClick={() => {
                      if (viewMonth === 0) {
                        setViewMonth(11);
                        setViewYear(viewYear - 1);
                      } else {
                        setViewMonth(viewMonth - 1);
                      }
                      handleSelectDay(d);
                    }}
                    className="h-8 rounded-lg text-xs text-stone-600 hover:bg-stone-800/40 hover:text-stone-400 transition-colors flex items-center justify-center"
                  >
                    {d}
                  </button>
                ))}

                {/* Current Month days */}
                {currentMonthDays.map((d) => {
                  const isSelected =
                    selectedDate &&
                    selectedDate.getFullYear() === viewYear &&
                    selectedDate.getMonth() === viewMonth &&
                    selectedDate.getDate() === d;

                  const isToday =
                    today.getFullYear() === viewYear &&
                    today.getMonth() === viewMonth &&
                    today.getDate() === d;

                  return (
                    <button
                      key={`cur-${d}`}
                      type="button"
                      onClick={() => handleSelectDay(d)}
                      className={`h-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center relative ${
                        isSelected
                          ? 'bg-amber-400 text-stone-950 font-bold shadow-md shadow-amber-400/20 ring-1 ring-amber-300'
                          : isToday
                          ? 'border border-amber-400/40 text-amber-300 hover:bg-amber-400/10'
                          : 'text-stone-200 hover:bg-stone-800 hover:text-white'
                      }`}
                    >
                      {d}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}

                {/* Next Month leading days */}
                {nextMonthDays.map((d, idx) => (
                  <button
                    key={`next-${idx}`}
                    type="button"
                    onClick={() => {
                      if (viewMonth === 11) {
                        setViewMonth(0);
                        setViewYear(viewYear + 1);
                      } else {
                        setViewMonth(viewMonth + 1);
                      }
                      handleSelectDay(d);
                    }}
                    className="h-8 rounded-lg text-xs text-stone-600 hover:bg-stone-800/40 hover:text-stone-400 transition-colors flex items-center justify-center"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Quick Preset Buttons */}
          {showPresets && (
            <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePresetToday}
                  className="px-2 py-1 rounded-md bg-stone-800 text-stone-200 hover:bg-amber-400 hover:text-stone-950 font-medium transition-colors"
                >
                  {t('today')}
                </button>
                <button
                  type="button"
                  onClick={handlePresetYesterday}
                  className="px-2 py-1 rounded-md bg-stone-800 text-stone-200 hover:bg-amber-400 hover:text-stone-950 font-medium transition-colors"
                >
                  {t('yesterday')}
                </button>
              </div>

              <button
                type="button"
                onClick={handlePresetMonthStart}
                className="text-[10px] text-amber-400 hover:underline px-1"
              >
                1st of Month
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
