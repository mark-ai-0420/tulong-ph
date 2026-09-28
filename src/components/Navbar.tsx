'use client';

import React from 'react';
import Link from 'next/link';
import { HeartHandshake, Languages, Compass, Building2, Printer, Trash2 } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  language: Language;
  onToggleLanguage: () => void;
  readyDocCount: number;
  onOpenPrivacyModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  language,
  onToggleLanguage,
  readyDocCount,
  onOpenPrivacyModal,
}) => {
  const t = translations[language];

  // Consolidated to 3 core workflows
  const navItems = [
    { id: 'triage', label: t.navTriage, icon: Compass },
    {
      id: 'print_forms',
      label: t.navPrintForms,
      icon: Printer,
      badge: readyDocCount > 0 ? readyDocCount : undefined,
    },
    { id: 'directory', label: t.navDirectory, icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2DFD6] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Authoritative Civic Emblem */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => onTabChange('triage')}
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group focus-ring rounded-xl py-1 pr-1 sm:pr-2"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTabChange('triage');
                }
              }}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-900 transition-colors shrink-0">
                <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                    Tulong<span className="text-blue-900">PH</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  Gabay sa Ayuda ng Gobyerno
                </p>
              </div>
            </div>

            <Link
              href="/privacy"
              className="hidden xl:inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 transition-colors focus-ring cursor-pointer shrink-0"
              title={
                language === 'taglish'
                  ? 'Zero server uploads. Alamin sa Data Privacy Charter.'
                  : 'Zero server uploads. Learn more in our Data Privacy Charter.'
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{language === 'taglish' ? 'Naka-save sa device' : 'Saved locally'}</span>
            </Link>
          </div>

          {/* Navigation Links - Desktop: Unified Segmented Rail (lg: 1024px+) */}
          <nav
            className="hidden lg:flex items-center bg-[#F3F2EC] p-1 rounded-xl border border-[#E2DFD6] shrink-0"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative h-11 min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 focus-ring cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-2xs border border-stone-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-900' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        isActive ? 'bg-blue-900 text-white' : 'bg-blue-50 text-blue-900'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Utility Cluster: Pisonet Privacy Mode + Language Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Public Computer Shop Privacy Wipe Button (Available on all screens) */}
            <button
              type="button"
              onClick={onOpenPrivacyModal}
              className="inline-flex items-center justify-center gap-1.5 h-11 min-h-[44px] min-w-[44px] px-2.5 sm:px-3.5 py-2.5 rounded-lg border border-stone-200/80 bg-white hover:bg-stone-100 hover:border-stone-300 text-xs font-semibold text-slate-700 hover:text-red-700 shadow-2xs transition-colors focus-ring cursor-pointer group shrink-0"
              aria-label={
                language === 'taglish'
                  ? 'Burahin ang Aking Datos (Pisonet / Shop Mode)'
                  : 'Clear All Data (Pisonet / Shop Mode)'
              }
              title={
                language === 'taglish'
                  ? 'Burahin ang Aking Datos (Pisonet / Shop Mode)'
                  : 'Clear All Data (Pisonet / Shop Mode)'
              }
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 transition-colors shrink-0" />
              <span className="hidden sm:inline">Shop Mode</span>
            </button>

            {/* Bilingual Toggle */}
            <button
              onClick={onToggleLanguage}
              className="h-11 min-h-[44px] min-w-[44px] px-2.5 sm:px-3.5 py-2.5 rounded-lg border border-stone-200/80 bg-white hover:bg-stone-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors inline-flex items-center justify-center gap-1.5 sm:gap-2 focus-ring cursor-pointer shrink-0"
              aria-label={`Palitan ang wika sa ${language === 'taglish' ? 'English' : 'Taglish'}`}
              title="Palitan ang wika / Switch language"
            >
              <Languages className="w-4 h-4 text-blue-900 shrink-0" />
              <span className="hidden sm:inline">{language === 'taglish' ? 'English' : 'Taglish'}</span>
              <span className="inline sm:hidden">{language === 'taglish' ? 'EN' : 'FIL'}</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Navigation Row (Equal 3-column grid - 100% visible across mobile viewports) */}
        <div className="lg:hidden pb-2.5 pt-1.5 border-t border-[#E2DFD6]">
          <div className="grid grid-cols-3 gap-1 bg-[#F3F2EC] p-1 rounded-xl border border-[#E2DFD6] w-full max-w-xl mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const shortLabels: Record<string, { taglish: string; en: string }> = {
                triage: { taglish: 'Gabay', en: 'Navigator' },
                print_forms: { taglish: 'Forms', en: 'Forms' },
                directory: { taglish: 'Direktoryo', en: 'Directory' },
              };
              const shortLabel = shortLabels[item.id]?.[language] || item.label;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`h-11 min-h-[44px] px-1 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center justify-center gap-1 sm:gap-1.5 focus-ring cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-2xs border border-stone-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-blue-900' : 'text-slate-500'}`} />
                  <span className="sm:hidden truncate">{shortLabel}</span>
                  <span className="hidden sm:inline truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs font-bold leading-none shrink-0 ${
                        isActive ? 'bg-blue-900 text-white' : 'bg-blue-50 text-blue-900'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
