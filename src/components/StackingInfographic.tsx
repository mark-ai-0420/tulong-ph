'use client';

import React from 'react';
import {
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  HeartPulse,
  Banknote,
  Landmark,
  BadgePercent,
  Sparkles,
  ArrowDown,
  Info,
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
      step: 1,
      badge: isTl ? 'Unang Bawas (Mandatory)' : 'Mandatory First Deductor',
      badgeColor: 'bg-blue-100 text-blue-950 border-blue-200',
      title: '1. PhilHealth Case Rates',
      subtitle: isTl ? 'Kaltas bago mag-compute ang ibang ahensya' : 'Deducted at billing before any other aid',
      icon: HeartPulse,
      accentColor: 'text-blue-700 bg-blue-50 border-blue-200',
      whatItCovers: isTl
        ? 'In-patient room, board, at standardized case rate package (₱10k - ₱100k+).'
        : 'In-patient room, board, and standardized disease case rate package.',
      secretTip: isTl
        ? 'Walang PhilHealth? Mag-inquire agad sa billing para sa instant Point of Service (POS) enrollment para sagutin pa rin ng gobyerno.'
        : 'No active PhilHealth? Request Point of Service (POS) enrollment at hospital billing to get covered on the spot.',
    },
    {
      step: 2,
      badge: isTl ? 'Batas sa Diskwento' : 'Statutory Deductions',
      badgeColor: 'bg-emerald-100 text-emerald-950 border-emerald-200',
      title: isTl ? '2. Senior Citizen & PWD Discount (20% + VAT Free)' : '2. Senior Citizen & PWD Discount (20% + VAT Free)',
      subtitle: isTl ? 'RA 9994 at RA 10754' : 'Republic Acts 9994 & 10754',
      icon: BadgePercent,
      accentColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      whatItCovers: isTl
        ? '20% kaltas at 12% VAT exemption sa professional fees ng doktor at mga gamot sa ospital.'
        : '20% discount plus 12% VAT exemption on attending physician fees and pharmacy bills.',
      secretTip: isTl
        ? 'Ipakita ang Senior Citizen ID o PWD ID sa unang araw pa lang ng admission sa billing clerk.'
        : 'Present OSCA / PWD ID on day 1 of hospital admission to ensure continuous automatic deduction.',
    },
    {
      step: 3,
      badge: isTl ? 'One-Stop Desk sa Ospital' : 'In-Hospital One-Stop Shop',
      badgeColor: 'bg-purple-100 text-purple-950 border-purple-200',
      title: isTl ? '3. Malasakit Center (DOH MAIP)' : '3. Malasakit Center (DOH MAIP)',
      subtitle: isTl ? 'RA 11463 — Nasa loob ng 200+ pampublikong ospital' : 'RA 11463 — Available inside 200+ public hospitals',
      icon: Building,
      accentColor: 'text-purple-700 bg-purple-50 border-purple-200',
      whatItCovers: isTl
        ? 'In-house hospital pharmacy medicines, laboratory tests, blood bank fees, at hospital ward fees.'
        : 'In-hospital medicines, laboratory work, blood bank fees, and remaining ward bill balance.',
      secretTip: isTl
        ? 'Huwag lumabas ng ospital! Sa loob mismo ng pampublikong ospital naroroon ang desk para mabawasan ang bill bago ang discharge.'
        : 'Zero travel needed. The social worker desk is stationed directly inside accredited government hospitals.',
    },
    {
      step: 4,
      badge: isTl ? 'Napakalaking Bill (₱50k pataas)' : 'Catastrophic Deficit (₱50k+)',
      badgeColor: 'bg-amber-100 text-amber-950 border-amber-200',
      title: isTl ? '4. PCSO MAP + PACe (Malacañang) + Senate GL' : '4. PCSO MAP + PACe (Office of the President) + Senate GL',
      subtitle: isTl ? 'Mga Guarantee Letter (GL) para sa operasyon, ICU, at implants' : 'Institutional Guarantee Letters for surgery, ICU, and implants',
      icon: Landmark,
      accentColor: 'text-amber-800 bg-amber-50 border-amber-200',
      whatItCovers: isTl
        ? 'Catastrophic surgical hardware (pacemaker, titanium plates), chemotherapy cycles, hemodialysis packs, at daang-libong ICU balances.'
        : 'High-cost surgical implants, chemotherapy medicines, dialysis packs, and six-figure ICU deficits.',
      secretTip: isTl
        ? 'PACe (Presidential Action Center) ang pinakamataas na sandigan kapag naubos na ang limit ng Malasakit at PCSO. Mag-email sa pace@op.gov.ph kalakip ang Social Case Study.'
        : 'PACe (Office of the President) is the premier executive lifeline when hospital Malasakit and PCSO limits are reached. Email pace@op.gov.ph with your Social Case Study.',
    },
    {
      step: 5,
      badge: isTl ? 'Tulong Pinansyal (Cash)' : 'Outright Cash Assistance',
      badgeColor: 'bg-rose-100 text-rose-950 border-rose-200',
      title: isTl ? '5. DSWD AICS & LGU Mayor Aid' : '5. DSWD AICS & City/Municipal Aid',
      subtitle: isTl ? 'Direct cash para sa gamot sa labas at pamasahe' : 'Direct cash for outside pharmacy receipts and emergency travel',
      icon: Banknote,
      accentColor: 'text-rose-700 bg-rose-50 border-rose-200',
      whatItCovers: isTl
        ? 'Reseta ng gamot na walang stock sa ospital (binili sa Mercury Drug/generics), outside CT/MRI, pamasahe pauwi (Balik Probinsya), at pampalibing.'
        : 'Prescription medicines bought outside hospital, outside diagnostic imaging, provincial transport fare, and funeral aid.',
      secretTip: isTl
        ? 'Tanging DSWD lamang ang nagbibigay ng DIRECT CASH sa kamay ng kaanak. Ang Malasakit, PACe, at PCSO ay Guarantee Letter (bawas sa bill) lamang.'
        : 'DSWD AICS is the sole national agency providing outright cash in hand. Malasakit, PACe, and PCSO issue Guarantee Letters to institutions.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Infographic Card */}
      <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
            <Layers className="w-3.5 h-3.5 text-blue-900" />
            <span>{isTl ? 'Opisyal na Gabay sa Pag-Stack ng Ayuda' : 'Official Government Aid Stacking Guide'}</span>
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {isTl ? 'Aligned sa RA 11463, RA 11032, at GAA 2026' : 'Aligned with RA 11463, RA 11032, and GAA 2026'}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isTl
            ? 'Paano I-stack ang Benepisyo ng Gobyerno para Umabot sa ₱0 ang Hospital Bill'
            : 'How to Legally Stack Philippine Government Aid for Near-Zero Hospital Bills'}
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          {isTl
            ? 'Hindi kailangang mabaon sa utang o humingi sa 5-6. Narito ang legal at opisyal na pagkakasunod-sunod ng mga bawas upang masalo ng PhilHealth, Malasakit, PACe (Malacañang), PCSO, at DSWD ang inyong bayarin.'
            : 'Filipino families do not need to turn to predatory lenders. Here is the official statutory stacking sequence recognized by hospital social workers to reduce catastrophic medical bills to manageable or zero balance.'}
        </p>
      </div>

      {/* The 5-Layer Visual Stacking Ladder */}
      <div className="space-y-4">
        {stackLayers.map((layer, idx) => {
          const Icon = layer.icon;
          return (
            <div key={layer.step} className="relative">
              <div className="bg-white rounded-2xl border border-[#E2DFD6] p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${layer.accentColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border mb-1 ${layer.badgeColor}`}>
                        {layer.badge}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">{layer.title}</h3>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{layer.subtitle}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                      {isTl ? 'Ano ang sinasagot nito:' : 'What it covers:'}
                    </span>
                    <p className="text-slate-600 leading-relaxed">{layer.whatItCovers}</p>
                  </div>
                  <div className="space-y-1 bg-[#FAF9F5] p-3 rounded-xl border border-[#E2DFD6]">
                    <span className="font-bold text-blue-900 block uppercase tracking-wider text-[11px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-900" />
                      {isTl ? 'Sikreto ng Social Worker:' : 'Social Worker Pro-Tip:'}
                    </span>
                    <p className="text-slate-700 leading-relaxed text-xs">{layer.secretTip}</p>
                  </div>
                </div>
              </div>

              {/* Connecting Flow Arrow */}
              {idx < stackLayers.length - 1 && (
                <div className="flex justify-center -my-2 relative z-10">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs border-2 border-white">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Critical Comparison: PACe vs Senate vs DSWD (Anti-Double Dipping Guide) */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-900" />
          </div>
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-amber-950">
              {isTl ? 'Gabay Laban sa Doble o Maling Aplikasyon (Anti-Double Dipping)' : 'Anti-Double Dipping & Jurisdiction Guide'}
            </h3>
            <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
              {isTl
                ? 'Kadalasan, nalilito ang pamilya kung kailan lalapit sa PACe (Office of the President), Senate Assist, o DSWD AICS. Tandaan ang 3 mahalagang panuntunan upang hindi ma-reject ng social worker:'
                : 'Families often get confused on whether to file with PACe (Office of the President), Senate Assist, or DSWD AICS. Keep these 3 critical rules in mind to avoid rejection by hospital evaluators:'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs">
                <span className="font-bold text-xs text-slate-900 block mb-1">
                  1. {isTl ? 'PACe (Malacañang)' : 'PACe (Presidential)'}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isTl
                    ? 'Para sa malalaking balance (₱50k - ₱1M+), transplant, bypass, at ICU. Naglalabas ng mataas na Guarantee Letter sa ospital.'
                    : 'Best for massive deficits (₱50k - ₱1M+), transplants, and ICU. Issues high-limit Guarantee Letters directly to the hospital.'}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs">
                <span className="font-bold text-xs text-slate-900 block mb-1">
                  2. {isTl ? 'Senate Assist' : 'Senate Assist'}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isTl
                    ? 'Para sa natitirang bill sa ospital at partner laboratories. Kung inendorso na sa DSWD para sa bill, hindi na pwedeng mag-apply ng hiwalay na DSWD hospital assistance.'
                    : 'For hospital balance and partner labs. If endorsed to DSWD for hospital charges, do not file a separate duplicate DSWD bill claim.'}
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs">
                <span className="font-bold text-xs text-slate-900 block mb-1">
                  3. {isTl ? 'DSWD AICS (Cash)' : 'DSWD AICS (Cash)'}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isTl
                    ? 'Tanging pinagkukunan ng OUTRIGHT CASH para sa mga gamot na binili sa labas ng ospital, pamasahe pauwi, at pagkain ng watcher.'
                    : 'Sole channel for OUTRIGHT CASH in hand for outside pharmacy medicines, provincial transportation, and watcher food allowance.'}
                </p>
              </div>
            </div>
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
                ? 'Gusto mo bang malaman ang eksaktong plano para sa iyong ospital at diagnosis?'
                : 'Want an automated personalized roadmap tailored to your specific hospital and bill?'}
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={() => onSelectTab('triage')}
              className="h-11 min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer w-full sm:w-auto text-center"
            >
              {isTl ? 'Simulan ang Triage Roadmap' : 'Start Triage Roadmap'}
            </button>
            <button
              onClick={() => onSelectTab('print_forms')}
              className="h-11 min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-slate-800 font-bold text-xs shadow-xs transition-colors cursor-pointer w-full sm:w-auto text-center"
            >
              {isTl ? 'I-print ang Forms' : 'Print Forms'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
