'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ExternalLink,
  Phone,
  PhoneCall,
  Clock,
  Building2,
  MapPin,
  Info,
  Copy,
  Check,
  BadgeAlert,
  ChevronDown,
  ChevronUp,
  Map,
  Sparkles,
} from 'lucide-react';
import { AGENCIES_DATABASE } from '@/lib/data/agencies';
import { MALASAKIT_CENTERS_DIRECTORY } from '@/lib/data/malasakitCenters';
import { Language, translations } from '@/lib/i18n';
import { parseDialableNumber, splitPhoneNumbers } from '@/lib/phoneUtils';

export interface DirectoryViewProps {
  language: Language;
  initialTab?: 'malasakit' | 'agencies';
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  language,
  initialTab = 'malasakit',
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'malasakit' | 'agencies'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedAgencyId, setExpandedAgencyId] = useState<string | null>('senate_assist');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination / Batching state for budget mobile devices
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Reset pagination when search or region filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, selectedRegion]);

  // Dynamically derive region hospital counts from MALASAKIT_CENTERS_DIRECTORY
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: MALASAKIT_CENTERS_DIRECTORY.length,
    };
    MALASAKIT_CENTERS_DIRECTORY.forEach((item) => {
      counts[item.region] = (counts[item.region] || 0) + 1;
    });
    return counts;
  }, []);

  // Dynamically derive distinct regions in a clean geographic order
  const availableRegions = useMemo(() => {
    const distinctRegions = Array.from(
      new Set(MALASAKIT_CENTERS_DIRECTORY.map((item) => item.region))
    ).filter(Boolean);

    const regionPriorityOrder = [
      'NCR',
      'CAR (Cordillera)',
      'Region I (Ilocos Region)',
      'Region II (Cagayan Valley)',
      'Region III (Central Luzon)',
      'Region IV-A (CALABARZON)',
      'Region IV-B (MIMAROPA)',
      'Region V (Bicol Region)',
      'Region VI (Western Visayas)',
      'Region VII (Central Visayas)',
      'Region VIII (Eastern Visayas)',
      'Region IX (Zamboanga Peninsula)',
      'Region X (Northern Mindanao)',
      'Region XI (Davao Region)',
      'Region XII (SOCCSKSARGEN)',
      'Region XIII (Caraga)',
      'BARMM',
      'BARMM (Bangsamoro)',
    ];

    distinctRegions.sort((a, b) => {
      const idxA = regionPriorityOrder.indexOf(a);
      const idxB = regionPriorityOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return ['All', ...distinctRegions];
  }, []);

  const categories = [
    { id: 'all', labelEn: 'All Agencies', labelTl: 'Lahat ng Ahensya' },
    { id: 'national_gl', labelEn: 'Guarantee Letters (GL)', labelTl: 'Guarantee Letters (GL)' },
    { id: 'in_hospital', labelEn: 'In-Hospital (Malasakit)', labelTl: 'Sa Loob ng Ospital' },
    { id: 'cash_crisis', labelEn: 'Cash Aid & Crisis', labelTl: 'Cash Aid & Krisis' },
    { id: 'insurance', labelEn: 'PhilHealth Insurance', labelTl: 'PhilHealth Insurance' },
    { id: 'specialized', labelEn: 'Specialized (PAGCOR/OWWA)', labelTl: 'Espesyal (PAGCOR/OWWA)' },
  ];

  // Filtering for Tab A: Malasakit Centers matching name, city, province, region, or keywords
  const filteredHospitals = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    const tokens = query.split(/\s+/).filter(Boolean);

    return MALASAKIT_CENTERS_DIRECTORY.filter((item) => {
      const matchesRegion = selectedRegion === 'All' || item.region === selectedRegion;
      if (!matchesRegion) return false;
      if (tokens.length === 0) return true;

      const searchableText = `${item.hospitalName} ${item.provinceOrCity} ${item.address} ${item.region} ${item.hospitalType}`.toLowerCase();
      return tokens.every((token) => searchableText.includes(token));
    });
  }, [searchTerm, selectedRegion]);

  const displayedHospitals = useMemo(() => {
    return filteredHospitals.slice(0, visibleCount);
  }, [filteredHospitals, visibleCount]);

  const hasMore = visibleCount < filteredHospitals.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredHospitals.length));
  };

  // Filtering for Tab B: Government Agencies & Hotlines
  const filteredAgencies = AGENCIES_DATABASE.filter((agency) => {
    const matchesCategory =
      selectedCategory === 'all' || agency.category === selectedCategory;
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      agency.name.toLowerCase().includes(query) ||
      agency.shortName.toLowerCase().includes(query) ||
      agency.descriptionEn.toLowerCase().includes(query) ||
      agency.descriptionTl.toLowerCase().includes(query) ||
      agency.hotline.toLowerCase().includes(query) ||
      agency.assistanceType.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const toggleExpandAgency = (id: string) => {
    setExpandedAgencyId(expandedAgencyId === id ? null : id);
  };

  const handleCopyPhone = async (phone: string, id: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner: Authoritative Civic Editorial Announcement Card */}
      <div className="bg-white border border-[#E2DFD6] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-950 border border-blue-200 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-blue-900" />
            <span>{language === 'taglish' ? '200+ Pampublikong Ospital sa Buong Bansa' : '200+ Public Hospitals Nationwide'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {language === 'taglish'
              ? 'Direktoryo ng Malasakit Desks at Hotline ng Pamahalaan'
              : 'Malasakit Desks & National Crisis Directory'}
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            {language === 'taglish'
              ? 'Mabilisang hanapin ang mga social worker desk sa loob ng 200 pampublikong ospital sa lahat ng 17 rehiyon, o tumawag nang direkta sa mga opisyal na hotline ng Senado, PCSO, DSWD, at PhilHealth.'
              : 'Quickly locate in-hospital social service desks across 200 public hospitals in all 17 regions, or call verified emergency hotlines for Senate, PCSO, DSWD, and PhilHealth.'}
          </p>
        </div>
      </div>

      {/* Main Unified View Toggle Rail */}
      <div className="bg-[#F3F2EC] p-1 rounded-2xl border border-[#E2DFD6] shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('malasakit')}
            className={`min-h-11 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'malasakit'
                ? 'bg-white text-slate-900 shadow-2xs border border-stone-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0 text-blue-900" />
            <span>
              {language === 'taglish'
                ? 'Tab A: Malasakit Center Desks (200 Ospital)'
                : 'Tab A: Malasakit Center Desks (200 Hospitals)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agencies')}
            className={`min-h-11 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'agencies'
                ? 'bg-white text-slate-900 shadow-2xs border border-stone-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border border-transparent'
            }`}
          >
            <PhoneCall className="w-4 h-4 shrink-0 text-blue-900" />
            <span>
              {language === 'taglish'
                ? 'Tab B: National Government Crisis Hotlines & Portals'
                : 'Tab B: National Government Crisis Hotlines & Portals'}
            </span>
          </button>
        </div>
      </div>

      {/* TAB A: MALASAKIT CENTER HOSPITAL DESKS */}
      {activeTab === 'malasakit' && (
        <div className="space-y-6">
          {/* In-Hospital Procedure Guide Banner */}
          <div className="bg-[#FAF8F5] border border-[#E2DFD6] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Info className="w-4 h-4 text-blue-700" />
              <span>
                {language === 'taglish'
                  ? 'Paano gamitin ang Malasakit Center Desk sa Ospital (RA 11463):'
                  : 'How to utilize the Malasakit Center in 3 simple steps (RA 11463):'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white rounded-xl p-3.5 border border-[#E2DFD6] space-y-1">
                <div className="font-bold text-slate-900">Hakbang 1: Pagka-admit</div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Sabihan agad ang Information o Nurse station na lalapit kayo sa Malasakit Center desk sa unang araw pa lamang.
                </p>
              </div>
              <div className="bg-white rounded-xl p-3.5 border border-[#E2DFD6] space-y-1">
                <div className="font-bold text-slate-900">Hakbang 2: Unified Intake Sheet</div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Punan ang isang Unified Intake Sheet kasama ang Medical Abstract at Running Bill para sa Medical Social Worker.
                </p>
              </div>
              <div className="bg-white rounded-xl p-3.5 border border-[#E2DFD6] space-y-1">
                <div className="font-bold text-slate-900">Hakbang 3: Automatic Deductions</div>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Awtomatikong ibabawas ang PhilHealth, DOH-MAIP fund, at PCSO allocations para mapababa o ma-zero ang bill.
                </p>
              </div>
            </div>
          </div>

          {/* Search & Region Filter Controls */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#E2DFD6] shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search input with min-h-11 */}
              <div className="relative md:col-span-2">
                <label htmlFor="directory-search-input" className="sr-only">
                  {language === 'taglish' ? 'Maghanap ng ospital, lungsod, o probinsya' : 'Search hospital, city, or province'}
                </label>
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="directory-search-input"
                  name="directorySearch"
                  type="text"
                  aria-label={language === 'taglish' ? 'Maghanap ng ospital, lungsod, o probinsya' : 'Search hospital, city, or province'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    language === 'taglish'
                      ? 'Maghanap ng pangalan ng ospital, lungsod, o probinsya...'
                      : 'Search hospital name, city, or province...'
                  }
                  className="min-h-11 w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white shadow-2xs text-slate-900"
                />
              </div>

              {/* Region Select with min-h-11 */}
              <div>
                <label htmlFor="directory-region-select" className="sr-only">
                  {language === 'taglish' ? 'Piliin ang Rehiyon' : 'Select Region'}
                </label>
                <select
                  id="directory-region-select"
                  name="directoryRegion"
                  aria-label={language === 'taglish' ? 'Piliin ang Rehiyon' : 'Select Region'}
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="min-h-11 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-800 bg-white shadow-2xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                >
                  {availableRegions.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg === 'All'
                        ? language === 'taglish'
                          ? `Lahat ng Rehiyon (${regionCounts['All'] || 0})`
                          : `All Regions (${regionCounts['All'] || 0})`
                        : `${reg} (${regionCounts[reg] || 0})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Region Filter Pills with counts */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
              {availableRegions.map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => {
                    setSelectedRegion(reg);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`min-h-11 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedRegion === reg
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-[#FAF8F5] border border-[#E2DFD6] text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {reg === 'All' ? (language === 'taglish' ? 'Lahat ng Rehiyon' : 'All Regions') : reg} ({regionCounts[reg] || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Hospital Results Count and Batch Info */}
          <div className="flex items-center justify-between gap-2 px-1 text-xs text-slate-600 font-semibold">
            <span>
              {language === 'taglish'
                ? `Ipinapakita ang ${displayedHospitals.length} sa ${filteredHospitals.length} ospital`
                : `Showing ${displayedHospitals.length} of ${filteredHospitals.length} hospitals`}
            </span>
            {filteredHospitals.length > PAGE_SIZE && (
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                {PAGE_SIZE} bawat pahina
              </span>
            )}
          </div>

          {/* Hospital Cards Grid (Batching 20 items for budget devices) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHospitals.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-[#E2DFD6] text-slate-600 text-xs font-medium">
                {language === 'taglish'
                  ? 'Walang nahanap na ospital na tumutugma sa inyong paghahanap.'
                  : 'No hospitals match your search criteria.'}
              </div>
            ) : (
              displayedHospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  className="bg-white rounded-2xl border border-[#E2DFD6] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-400 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                        {hospital.region}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        ~{hospital.bedCapacityApprox} Beds
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {hospital.hospitalName}
                    </h3>

                    <div className="text-xs text-slate-700 space-y-2 pt-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{hospital.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>{hospital.operatingHours}</span>
                      </div>
                    </div>
                  </div>

                  {/* High Contrast Emergency Contact & Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-blue-950 bg-blue-50 px-2.5 py-1 rounded-md text-xs border border-blue-200">
                        {hospital.hospitalType}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          hospital.hospitalName + ' ' + hospital.address
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-11 px-3 py-2.5 inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-blue-700 text-xs transition-colors cursor-pointer"
                      >
                        <Map className="w-3.5 h-3.5" />
                        <span>Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* One-tap Copy Phone Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(hospital.contactNumber, hospital.id)}
                        className="flex-1 min-h-11 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-2xs cursor-pointer"
                      >
                        {copiedId === hospital.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-800 font-extrabold">
                              {language === 'taglish' ? 'Kinopya ang Telepono!' : 'Copied Phone!'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-600" />
                            <span>{language === 'taglish' ? 'Kopyahin ang Telepono' : 'Copy Phone Number'}</span>
                          </>
                        )}
                      </button>

                      {/* Direct Call Link */}
                      <a
                        href={`tel:${parseDialableNumber(hospital.contactNumber)}`}
                        className="min-h-11 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{hospital.contactNumber}</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Batching Controls */}
          {hasMore && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleLoadMore}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
                <span>
                  {language === 'taglish'
                    ? `Tingnan ang Higit Pa (Ipakita ang susunod na ${Math.min(PAGE_SIZE, filteredHospitals.length - visibleCount)})`
                    : `Load More (Show next ${Math.min(PAGE_SIZE, filteredHospitals.length - visibleCount)})`}
                </span>
              </button>
            </div>
          )}

          {!hasMore && filteredHospitals.length > PAGE_SIZE && (
            <div className="text-center py-4 text-xs font-semibold text-slate-500">
              {language === 'taglish'
                ? `✓ Naipakita na ang lahat ng ${filteredHospitals.length} ospital.`
                : `✓ Showing all ${filteredHospitals.length} hospitals.`}
            </div>
          )}
        </div>
      )}

      {/* TAB B: NATIONAL GOVERNMENT CRISIS HOTLINES & PORTALS */}
      {activeTab === 'agencies' && (
        <div className="space-y-6">
          {/* Anti-Scam Advisory */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-3 shadow-xs">
            <BadgeAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950">
                {language === 'taglish' ? 'BABALA LABAN SA MGA FIXER AT SCAMMER:' : 'IMPORTANT ANTI-SCAM ADVISORY:'}
              </span>{' '}
              {language === 'taglish'
                ? 'Ang lahat ng application form at tulong mula sa Senado, PCSO, DOH Malasakit, at DSWD ay 100% LIBRE. Huwag magbabayad kaninuman na nangangakong "magpapabilis" o hihingi ng porsyento (10%-30%) sa matatanggap na ayuda.'
                : 'All official government assistance application forms and procedures are 100% FREE. Never pay fixers, middlemen, or unauthorized third parties claiming guaranteed approval in exchange for a fee or percentage cut.'}
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#E2DFD6] shadow-xs">
            {/* Search Input with min-h-11 */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  language === 'taglish'
                    ? 'Maghanap ng ahensya, sakit, uri ng tulong, o hotline...'
                    : 'Search by agency name, illness, hotline, or type of assistance...'
                }
                className="min-h-11 w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white shadow-2xs text-slate-900"
              />
            </div>

            {/* Category Filter Pills with min-h-11 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-11 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[#FAF8F5] border border-[#E2DFD6] text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {language === 'taglish' ? cat.labelTl : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Agency Cards */}
          <div className="space-y-4">
            {filteredAgencies.map((agency) => {
              const isExpanded = expandedAgencyId === agency.id;

              return (
                <div
                  key={agency.id}
                  className="bg-white rounded-2xl border border-[#E2DFD6] shadow-xs overflow-hidden transition-all hover:border-slate-400"
                >
                  {/* Card Header */}
                  <div
                    onClick={() => toggleExpandAgency(agency.id)}
                    className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none hover:bg-[#FAF8F5]/60 transition-colors"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                          {agency.badge}
                        </span>
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800">
                          {agency.assistanceType}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {agency.processingTime}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{agency.name}</h3>
                      <p className="text-xs text-slate-700 mt-1 max-w-3xl leading-relaxed">
                        {language === 'taglish' ? agency.descriptionTl : agency.descriptionEn}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-blue-700 hidden sm:inline">
                        {isExpanded ? 'Itago ang Detalye' : 'Tingnan ang Requirements'}
                      </span>
                      <div className="min-h-11 min-w-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hotline Action Bar - Always Visible */}
                  <div className="px-5 py-3.5 bg-[#FAF8F5] border-t border-[#E2DFD6] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="text-slate-700">Hotline:</span>
                      <span className="text-slate-900 font-black">{agency.hotline}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* One-tap Copy Phone Button with min-h-11 py-2.5 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyPhone(agency.hotline, agency.id);
                        }}
                        className="min-h-11 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:border-blue-500 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors active:scale-95 shadow-2xs"
                      >
                        {copiedId === agency.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-800 font-extrabold">
                              {language === 'taglish' ? 'Kinopya ang Telepono!' : 'Copied Phone!'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-600" />
                            <span>{language === 'taglish' ? 'Kopyahin ang Telepono' : 'Copy Phone Number'}</span>
                          </>
                        )}
                      </button>

                      {/* Direct Call Link(s) */}
                      {(() => {
                        const phoneOptions = splitPhoneNumbers(agency.hotline);
                        if (phoneOptions.length === 0) return null;
                        if (phoneOptions.length === 1) {
                          const dialable = parseDialableNumber(phoneOptions[0].dialable);
                          if (!dialable) return null;
                          return (
                            <a
                              href={`tel:${dialable}`}
                              onClick={(e) => e.stopPropagation()}
                              className="min-h-11 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                            >
                              <Phone className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                              <span>{language === 'taglish' ? 'Tumawag' : 'Call'}</span>
                            </a>
                          );
                        }
                        return phoneOptions.map((opt, idx) => {
                          const dialable = parseDialableNumber(opt.dialable);
                          if (!dialable) return null;
                          return (
                            <a
                              key={idx}
                              href={`tel:${dialable}`}
                              onClick={(e) => e.stopPropagation()}
                              className="min-h-11 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                              title={`Call ${dialable}`}
                            >
                              <Phone className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                              <span>{opt.label}</span>
                            </a>
                          );
                        });
                      })()}

                      {/* Open Official Portal */}
                      <a
                        href={agency.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <span>{t.openOfficialPortal}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-5 border-t border-[#E2DFD6] bg-white space-y-5 text-xs">
                      {/* Two Column Layout: Eligibility & Requirements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Eligibility */}
                        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E2DFD6] space-y-2">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                            {language === 'taglish' ? 'Sino ang Kwalipikado?' : 'Who is Eligible?'}
                          </h4>
                          <ul className="space-y-1.5 text-slate-700 list-disc pl-4 leading-relaxed">
                            {(language === 'taglish'
                              ? agency.eligibilityTl
                              : agency.eligibilityEn
                            ).map((el, idx) => (
                              <li key={idx}>{el}</li>
                            ))}
                          </ul>
                        </div>

                        {/* How to Apply */}
                        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E2DFD6] space-y-2">
                          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                            {language === 'taglish' ? 'Paano Mag-apply?' : 'Step-by-Step Procedure:'}
                          </h4>
                          <ol className="space-y-1.5 text-slate-700 list-decimal pl-4 leading-relaxed">
                            {(language === 'taglish'
                              ? agency.howToApplyStepsTl
                              : agency.howToApplyStepsEn
                            ).map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      {/* Policy Footer */}
                      <div className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-900">Re-application Policy:</span>{' '}
                        {agency.reapplicationPolicy}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
