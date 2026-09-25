'use client';

import React from 'react';
import { HeartHandshake, Languages, Compass, Building2, Printer, Trash2, ShieldAlert } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Authoritative Civic Emblem */}
          <div
            onClick={() => onTabChange('triage')}
            className="flex items-center gap-3 cursor-pointer group focus-ring rounded-xl py-1 pr-2"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTabChange('triage');
              }
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-900 transition-colors shrink-0">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Tulong<span className="text-blue-900">PH</span>
                </span>
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                  title="Zero server uploads; patient data stays 100% on the user's phone."
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{language === 'taglish' ? 'Naka-save sa device' : 'Saved locally'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Gabay sa Ayuda ng Gobyerno
              </p>
            </div>
          </div>

          {/* Navigation Links - Desktop: Unified Segmented Rail */}
          <nav
            className="hidden md:flex items-center bg-[#F3F2EC] p-1 rounded-xl border border-[#E2DFD6]"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative h-11 min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 focus-ring cursor-pointer ${
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
          <div className="flex items-center gap-2">
            {/* Public Computer Shop Privacy Wipe Button (Desktop) */}
            <button
              type="button"
              onClick={onOpenPrivacyModal}
              className="hidden sm:inline-flex items-center gap-1.5 h-11 min-h-[44px] px-3.5 py-2.5 rounded-lg border border-stone-200/80 bg-white hover:bg-stone-100 hover:border-stone-300 text-xs font-semibold text-slate-600 hover:text-red-700 shadow-2xs transition-colors focus-ring cursor-pointer group"
              title={
                language === 'taglish'
                  ? 'Burahin ang Aking Datos (Pisonet / Shop Mode)'
                  : 'Clear All Data (Pisonet / Shop Mode)'
              }
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-600 transition-colors shrink-0" />
              <span className="hidden xl:inline">
                {language === 'taglish' ? 'Pisonet / Shop Mode' : 'Pisonet / Shop Mode'}
              </span>
              <span className="xl:hidden">
                {language === 'taglish' ? 'Shop Mode' : 'Shop Mode'}
              </span>
            </button>

            {/* Bilingual Toggle */}
            <button
              onClick={onToggleLanguage}
              className="h-11 min-h-[44px] px-3.5 py-2.5 rounded-lg border border-stone-200/80 bg-white hover:bg-stone-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors inline-flex items-center gap-2 focus-ring cursor-pointer"
              title="Palitan ang wika / Switch language"
            >
              <Languages className="w-4 h-4 text-blue-900" />
              <span>{language === 'taglish' ? 'English' : 'Taglish'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row (Segmented horizontal rail) */}
        <div className="md:hidden flex items-center justify-between gap-2 pb-2.5 pt-1.5 border-t border-[#E2DFD6] overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 bg-[#F3F2EC] p-1 rounded-xl border border-[#E2DFD6] shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`h-11 min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 focus-ring cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-2xs border border-stone-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-900' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
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

          {/* Public Computer Shop Privacy Wipe Button (Mobile) */}
          <button
            type="button"
            onClick={onOpenPrivacyModal}
            className="h-11 min-h-[44px] px-3 py-2 rounded-xl border border-stone-200/80 bg-white hover:bg-stone-100 hover:border-stone-300 text-slate-600 hover:text-red-700 shadow-2xs transition-colors flex items-center gap-1 text-xs font-semibold shrink-0 cursor-pointer"
            title={
              language === 'taglish'
                ? 'Burahin ang Aking Datos (Pisonet / Shop Mode)'
                : 'Clear All Data (Pisonet / Shop Mode)'
            }
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Shop</span>
          </button>
        </div>
      </div>
    </header>
  );
};
