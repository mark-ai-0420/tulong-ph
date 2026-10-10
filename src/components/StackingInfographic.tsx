'use client';

import React from 'react';
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
  Building2,
  HeartPulse,
  Banknote,
  Landmark,
  BadgePercent,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Language } from '@/lib/i18n';

interface StackingInfographicProps {
  language: Language;
  onSelectTab?: (tab: 'triage' | 'print_forms' | 'directory') => void;
}

export const StackingInfographic: React.FC<StackingInfographicProps> = ({
  language,
  onSelectTab,
}) => {
  const isTl = language === 'taglish';

  const stackLayers = [
    {
      step: '01',
      agency: 'PhilHealth',
      statute: 'Universal Health Care Act (RA 11223)',
      nature: isTl ? 'Awtomatikong Bawas (Case Rates)' : 'Automatic Deduction (Case Rates)',
      natureBadge: 'bg-blue-50 text-blue-900 border-blue-200',
      title: isTl ? '1. PhilHealth Case Rates' : '1. PhilHealth Case Rates',
      subtitle: isTl ? 'Mandatory unang bawas sa billing ng ospital' : 'Mandatory first deductor on hospital billing',
      icon: HeartPulse,
      coverage: isTl
        ? 'In-patient hospital ward, board, operating room fees, at standardized package rates para sa sakit o operasyon (₱10,000 hanggang ₱100,000+ depende sa case rate).'
        : 'In-patient hospital room, board, professional doctor fees, and standardized diagnostic packages for covered medical conditions.',
      advisory: isTl
        ? 'Walang active PhilHealth? Magtanong agad sa hospital billing para sa instant Point of Service (POS) enrollment para sagutin pa rin ng gobyerno ang inyong case rate.'
        : 'No active PhilHealth contribution? Request Point of Service (POS) enrollment directly at hospital billing to secure immediate coverage.',
    },
    {
      step: '02',
      agency: 'Senior / PWD',
      statute: 'RA 9994 at RA 10754',
      nature: isTl ? '20% Bawas + 12% VAT Exemption' : '20% Discount + 12% VAT Exemption',
      natureBadge: 'bg-slate-100 text-slate-800 border-slate-300',
      title: isTl ? '2. Senior Citizen & PWD Diskwento' : '2. Senior Citizen & PWD Statutory Discount',
      subtitle: isTl ? 'Ibinabawas matapos ma-kaltas ang PhilHealth' : 'Calculated after PhilHealth deduction',
      icon: BadgePercent,
      coverage: isTl
        ? '20% diskwento at 12% VAT exemption sa professional fees ng attending physicians, mga laboratory tests, diagnostic imaging, at mga gamot sa ospital.'
        : '20% discount and full 12% VAT exemption on attending physician fees, laboratory tests, diagnostic imaging, and hospital pharmacy medicines.',
      advisory: isTl
        ? 'Ipakita ang Senior Citizen OSCA ID o PWD ID sa unang araw pa lang ng confinement sa billing clerk. Tandaan: Bawal pagsamahin ang Senior at PWD discount sa iisang pasyente.'
        : 'Present OSCA / PWD ID on the first day of hospital admission to ensure continuous automatic deduction. Stacking Senior and PWD discounts together is prohibited by law.',
    },
    {
      step: '03',
      agency: 'Malasakit Center (DOH MAIP)',
      statute: 'Malasakit Centers Act (RA 11463)',
      nature: isTl ? 'Guarantee Letter (Loob ng Ospital)' : 'Guarantee Letter (In-Hospital Balance)',
      natureBadge: 'bg-blue-50 text-blue-900 border-blue-200',
      title: isTl ? '3. Malasakit Center Desk (DOH MAIP)' : '3. Malasakit Center Desk (DOH MAIP)',
      subtitle: isTl ? 'Matatagpuan sa loob ng 200+ pampublikong ospital' : 'Stationed inside 200+ government hospitals nationwide',
      icon: Building2,
      coverage: isTl
        ? 'Lahat ng gastusin sa loob ng ospital: in-house hospital pharmacy medicines, laboratory fees, blood transfusion fees, at running hospital ward charges.'
        : 'All expenses incurred inside the hospital: in-house pharmacy medicines, laboratory diagnostic tests, blood bank fees, and inpatient ward charges.',
      advisory: isTl
        ? 'Huwag lumabas ng ospital! Sa loob mismo ng pampublikong ospital naroroon ang desk. Magtungo sa Medical Social Work Department (MSWD) bago ma-discharge ang pasyente.'
        : 'Zero outside travel required. The desk is stationed directly inside government hospitals. Visit the Medical Social Worker before hospital discharge.',
    },
    {
      step: '04',
      agency: 'PCSO MAP & PACe (Malacañang)',
      statute: 'Presidential Social Fund & PCSO Charter',
      nature: isTl ? 'Guarantee Letter (Malalaking Bill)' : 'High-Value Guarantee Letter',
      natureBadge: 'bg-slate-100 text-slate-800 border-slate-300',
      title: isTl ? '4. PCSO MAP + PACe (Malacañang) / Senate GL' : '4. PCSO MAP + PACe (Office of the President) / Senate GL',
      subtitle: isTl ? 'Para sa natitirang balanse na ₱50,000 pataas' : 'For remaining deficits of ₱50,000 and above',
      icon: Landmark,
      coverage: isTl
        ? 'Mamahaling surgical implants (titanium plates, pacemaker), chemotherapy sessions, hemodialysis packages, at daang-libong ICU balances matapos ma-exhaust ang Malasakit.'
        : 'High-cost surgical implants, chemotherapy medicines, dialysis packs, and six-to-seven figure ICU deficits exceeding hospital Malasakit limits.',
      advisory: isTl
        ? 'Ang PACe (Presidential Action Center sa Malacañang) ang pinakamataas na takbuhan para sa catastrophic bills. Magsumite ng liham sa Pangulo kalakip ang Social Case Study Report (SCSR).'
        : 'PACe (Office of the President) is the highest executive lifeline for catastrophic bills. Submit a formal request letter to the President with an MSWD Social Case Study Report.',
    },
    {
      step: '05',
      agency: 'DSWD AICS & LGU',
      statute: 'DSWD Executive Social Welfare Mandate',
      nature: isTl ? 'Outright Cash Assistance' : 'Direct Outright Cash Aid',
      natureBadge: 'bg-emerald-50 text-emerald-950 border-emerald-200',
      title: isTl ? '5. DSWD AICS at Municipal/City Aid' : '5. DSWD AICS & Local Government Aid',
      subtitle: isTl ? 'Direct cash para sa gamot sa labas at pamasahe' : 'Direct cash payout for external medicines and transportation',
      icon: Banknote,
      coverage: isTl
        ? 'Mga reseta ng gamot na walang stock sa botika ng ospital (binili sa Mercury Drug o generic pharmacy), outside CT/MRI scans, pamasahe pauwi (Balik Probinsya), at funeral aid.'
        : 'Prescription medicines out-of-stock in the hospital, outside CT/MRI scans, emergency transport fare back to provinces, and funeral assistance.',
      advisory: isTl
        ? 'Tanging DSWD lamang ang nagbibigay ng DIRECT CASH sa kamay ng kaanak. Ang PhilHealth, Malasakit, PCSO, at PACe ay Guarantee Letter (bawas sa billing) lamang.'
        : 'DSWD AICS is the sole national agency releasing OUTRIGHT CASH into claimant hands. PhilHealth, Malasakit, PCSO, and PACe issue institutional Guarantee Letters.',
    },
  ];

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* Header Civic Banner */}
      <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200/80 shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-blue-900" />
            <span>{isTl ? 'Opisyal na Gabay sa Pag-Stack ng Ayuda' : 'Official Government Aid Stacking Guide'}</span>
          </span>
          <span className="text-xs font-semibold text-slate-600 bg-stone-100 px-2.5 py-1 rounded-lg border border-[#E2DFD6]">
            {isTl ? 'Batay sa RA 11463, RA 9994, at GAA 2026' : 'Statutory Basis: RA 11463, RA 9994, GAA 2026'}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {isTl
            ? 'Tamang Pagkakasunod-sunod ng Bawas sa Hospital Bill'
            : 'Statutory Sequencing for Philippine Medical Assistance'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 mt-2 max-w-3xl leading-relaxed">
          {isTl
            ? 'Upang mapababa ang bayarin mula daan-daang libo hanggang ₱0 (Zero Balance Billing), mahigpit na sinusunod ng mga ospital at Medical Social Workers ang 5-hakbang na pagkakasunod-sunod sa ibaba:'
            : 'To systematically reduce catastrophic hospital bills to manageable or zero balance, hospital billing departments and Medical Social Workers strictly enforce the 5-step sequence below:'}
        </p>
      </div>

      {/* The 5-Layer Connected Civic Timeline Ladder */}
      <div className="relative pl-0 sm:pl-3 space-y-4 before:hidden sm:before:block before:absolute before:left-7.5 before:top-8 before:bottom-8 before:w-0.5 before:bg-[#E2DFD6]">
        {stackLayers.map((layer) => {
          return (
            <div key={layer.step} className="relative flex flex-col sm:flex-row items-start gap-4">
              {/* Step Sequence Badge (Desktop: Timeline Node; Mobile: Header Tag) */}
              <div className="hidden sm:flex w-9 h-9 rounded-xl bg-white border-2 border-blue-900 text-blue-900 font-mono font-bold text-xs items-center justify-center shrink-0 shadow-2xs z-10">
                {layer.step}
              </div>

              {/* Card Container */}
              <div className="bg-white rounded-2xl border border-[#E2DFD6] p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-colors flex-1 w-full space-y-4">
                {/* Header Information Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#E2DFD6]">
                  <div className="flex items-center gap-3">
                    <div className="sm:hidden w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {layer.step}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {layer.title}
                        </h3>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${layer.natureBadge}`}>
                          {layer.nature}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{layer.subtitle}</p>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-slate-500 shrink-0">
                    {layer.statute}
                  </span>
                </div>

                {/* 2-Column Content Layout: Coverage vs Social Worker Advisory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: What It Covers */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      {isTl ? 'Ano ang sinasagot nito:' : 'What it covers:'}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {layer.coverage}
                    </p>
                  </div>

                  {/* Right Column: Social Worker Advisory */}
                  <div className="bg-[#FAF9F5] border border-[#E2DFD6] rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-900">
                      <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0" />
                      <span>{isTl ? 'Paalala ng Social Worker:' : 'Social Worker Advisory:'}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {layer.advisory}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Critical Civic Advisory: Anti-Double Dipping & Jurisdictional Split */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-900" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-amber-950">
              {isTl
                ? 'Mahalagang Paalala: Panuntunan Laban sa Pagdoble (Anti-Double Dipping)'
                : 'Crucial Notice: Anti-Double Dipping & Agency Jurisdiction Rules'}
            </h3>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              {isTl
                ? 'Upang hindi ma-reject ng medical social worker ang inyong aplikasyon, tandaan ang pagkakaiba ng tatlong pangunahing sangay:'
                : 'To prevent rejection by hospital social evaluators, observe the clear jurisdictional boundaries between these three key aid channels:'}
            </p>
          </div>
        </div>

        {/* 3-Column Comparative Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-white p-4 rounded-xl border border-amber-200/70 shadow-2xs space-y-1.5">
            <span className="font-bold text-xs text-slate-900 block">
              1. {isTl ? 'PACe (Malacañang)' : 'PACe (Office of the President)'}
            </span>
            <span className="inline-block text-[12px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {isTl ? 'Para sa ₱50k – ₱1M+ na Bill' : 'Deficits ₱50k to ₱1M+'}
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isTl
                ? 'Para sa open heart surgery, organ transplant, at ICU charges matapos maubos ang limit ng Malasakit at PCSO.'
                : 'For organ transplants, open-heart surgeries, and ICU charges exceeding hospital Malasakit and PCSO limits.'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200/70 shadow-2xs space-y-1.5">
            <span className="font-bold text-xs text-slate-900 block">
              2. {isTl ? 'Senate Assist' : 'Senate Assist'}
            </span>
            <span className="inline-block text-[12px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              {isTl ? 'Guarantee Letter (Hospital Deficit)' : 'Hospital Guarantee Letter'}
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isTl
                ? 'Kung inendorso na ng Senado sa DSWD ang inyong hospital bill, bawal na mag-apply ng hiwalay na direct DSWD para sa parehong billing.'
                : 'If Senate Assist endorsed your hospital bill to DSWD, do not file a separate direct DSWD claim for that exact same bill.'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200/70 shadow-2xs space-y-1.5">
            <span className="font-bold text-xs text-slate-900 block">
              3. {isTl ? 'Direct DSWD AICS' : 'Direct DSWD AICS'}
            </span>
            <span className="inline-block text-[12px] font-semibold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {isTl ? 'Outright Cash (Gamot sa Labas)' : 'Direct Cash (Outside Meds)'}
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isTl
                ? 'Pumunta sa DSWD Field Office bitbit ang reseta ng gamot na binili sa Mercury/Southstar, pamasahe pauwi, at funeral expenses.'
                : 'Visit DSWD Field Office with receipts for medicines bought outside the hospital, diagnostic scans, and travel fare.'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer Call to Start Triage or Print */}
      {onSelectTab && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-[#E2DFD6] shadow-xs">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-900 shrink-0" />
            <p className="text-xs sm:text-sm text-slate-700 font-medium">
              {isTl
                ? 'Nais mo bang makita ang eksaktong plano at bawas para sa iyong ospital at bill?'
                : 'Want an automated personalized roadmap tailored to your specific hospital and bill?'}
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={() => onSelectTab('triage')}
              className="h-11 min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer w-full sm:w-auto text-center inline-flex items-center justify-center gap-1.5 focus-ring"
            >
              <span>{isTl ? 'Simulan ang Triage Roadmap' : 'Start Triage Roadmap'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSelectTab('print_forms')}
              className="h-11 min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#E2DFD6] hover:bg-stone-50 text-slate-800 font-bold text-xs shadow-2xs transition-colors cursor-pointer w-full sm:w-auto text-center focus-ring"
            >
              {isTl ? 'I-print ang Forms' : 'Print Forms'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
