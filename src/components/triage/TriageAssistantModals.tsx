import React from 'react';

import { ArrowLeft, Printer, AlertTriangle, X, Phone } from 'lucide-react';
import { PatientProfile, RepresentativeProfile, MedicalCase, StoredDocument, ApplicationRecord } from '@/types/assistance';

import { Language, translations } from '@/lib/i18n';
import { PCSOAssistant } from '../PCSOAssistant';
import { SenateAssistant } from '../SenateAssistant';
import { PACEAssistant } from '../PACEAssistant';

import { LGUAndCongressionalAssistant } from '../LGUAndCongressionalAssistant';
import { StackingInfographic } from '../StackingInfographic';

import { parseDialableNumber } from '@/lib/phoneUtils';

interface TriageAssistantModalsProps {
  patient: PatientProfile;
  representative: RepresentativeProfile;
  medicalCase: MedicalCase;
  documents: StoredDocument[];
  language: Language;
  onNavigateToTab: (tab: string) => void;
  activeModal: 'pcso' | 'senate' | 'pace' | 'lgu_congressional' | 'infographic' | 'transfer_rights' | null;
  setActiveModal: React.Dispatch<React.SetStateAction<'pcso' | 'senate' | 'pace' | 'lgu_congressional' | 'infographic' | 'transfer_rights' | null>>;
  localApplications: ApplicationRecord[];
  handleSaveApplications: (apps: ApplicationRecord[]) => Promise<void>;
}

export function TriageAssistantModals({
  patient,
  representative,
  medicalCase,
  documents,
  language,
  onNavigateToTab,
  activeModal,
  setActiveModal,
  localApplications,
  handleSaveApplications,
}: TriageAssistantModalsProps) {
  const t = translations[language];

  return (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="embedded-assistant-title"
          aria-describedby="embedded-assistant-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null);
            }
          }}
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-5xl bg-[#FAF9F5] border border-[#E2DFD6] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200">
            {/* High-Contrast Civic Editorial Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#E2DFD6] px-5 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      activeModal === 'pcso'
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                        : activeModal === 'senate'
                        ? 'bg-blue-100 text-blue-950 border-blue-300'
                        : activeModal === 'pace'
                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                        : activeModal === 'lgu_congressional'
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                        : activeModal === 'transfer_rights'
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                        : 'bg-blue-50 text-blue-900 border-blue-200'
                    }`}
                  >
                    {activeModal === 'pcso'
                      ? 'PCSO MAP DIRECT ASSISTANT'
                      : activeModal === 'senate'
                      ? 'SENATE SPAO 90-DAY TRACKER'
                      : activeModal === 'pace'
                      ? 'PRESIDENTIAL ACTION CENTER (OP)'
                      : activeModal === 'lgu_congressional'
                      ? 'LGU & CONGRESSIONAL MEDICAL ASSISTANCE'
                      : activeModal === 'transfer_rights'
                      ? 'EMERGENCY TRANSFER PROTOCOL (RA 8344 / RA 10932)'
                      : 'OFFICIAL AID STACKING INFOGRAPHIC'}
                  </span>
                </div>
                <h2 id="embedded-assistant-title" className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {activeModal === 'pcso'
                    ? 'PCSO Medical Assistance Program (MAP) Assistant'
                    : activeModal === 'senate'
                    ? 'Senate Public Assistance Office (SPAO) Tracker'
                    : activeModal === 'pace'
                    ? (language === 'taglish'
                        ? 'Presidential Action Center (PACe) - Malacañang'
                        : 'Presidential Action Center (PACe) - Malacañang')
                    : activeModal === 'lgu_congressional'
                    ? (language === 'taglish'
                        ? 'Assistant para sa LGU at Congressional GL'
                        : 'LGU and Congressional GL Assistant')
                    : activeModal === 'transfer_rights'
                    ? (language === 'taglish'
                        ? '5-Stage Inter-Hospital Transfer Playbook (Zero-Bankruptcy Route)'
                        : '5-Stage Inter-Hospital Transfer Playbook (Zero-Bankruptcy Route)')
                    : (language === 'taglish'
                        ? 'Gabay sa Pag-Stack ng Ayuda ng Gobyerno'
                        : 'Official Government Aid Stacking Guide')}
                </h2>
                <p id="embedded-assistant-desc" className="text-xs sm:text-sm text-slate-600 font-medium">
                  {activeModal === 'pcso'
                    ? (language === 'taglish'
                        ? 'Live Philippine Time tracker para sa 7:00 AM queue, 2.0MB single-PDF compliance, at opisyal na gabay.'
                        : 'Live Philippine Standard Time tracker for the 7:00 AM queue, 2.0MB PDF compliance, and official guidance.')
                    : activeModal === 'senate'
                    ? (language === 'taglish'
                        ? 'Pre-formatted Guarantee Letter (GL) request letter, 90-day cooldown tracker, at record keeper.'
                        : 'Pre-formatted Guarantee Letter (GL) request letter, 90-day cooldown policy tracker, and record keeper.')
                    : activeModal === 'pace'
                    ? (language === 'taglish'
                        ? 'Pre-formatted na liham sa Pangulo ng Pilipinas, opisyal na requirements, at PACe filing channels para sa malalaking bill.'
                        : 'Pre-formatted request letter to the President, documentary checklist, and direct PACe Malacañang submission channels.')
                    : activeModal === 'lgu_congressional'
                    ? (language === 'taglish'
                        ? 'Gumawa ng pormal na liham para sa Mayor, Governor, o kinatawan at i-coordinate ang bawat GL sa ospital.'
                        : 'Prepare a formal letter for a Mayor, Governor, or Representative and coordinate each GL with the hospital.')
                    : activeModal === 'transfer_rights'
                    ? (language === 'taglish'
                        ? 'Hakbang-hakbang na gabay para sa ligtas at legal na paglipat mula pribado patungo sa pampublikong specialty hospital upang maiwasan ang nakalulubog na utang sa ICU.'
                        : 'Step-by-step clinical and administrative roadmap for emergency inter-hospital transfer to public tertiary centers to halt runaway private debt.')
                    : (language === 'taglish'
                        ? '5-Hakbang na opisyal na gabay mula PhilHealth, Malasakit, PACe, PCSO, hanggang DSWD cash assistance.'
                        : '5-Pillar official statutory stacking architecture from PhilHealth, Malasakit, PACe, to DSWD cash assistance.')}
                </p>
              </div>

              {/* Prominent Back to Roadmap Button */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{language === 'taglish' ? 'Bumalik sa Roadmap' : 'Back to Roadmap'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label="Close modal"
                  className="h-11 min-h-11 min-w-11 inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded Assistant Modal Body */}
            <div className="p-4 sm:p-7 overflow-y-auto flex-1 space-y-6">
              {activeModal === 'pcso' && (
                <PCSOAssistant
                  documents={documents}
                  patient={patient}
                  language={language}
                  onNavigateToVault={() => {
                    setActiveModal(null);
                    onNavigateToTab('print_forms');
                  }}
                />
              )}
              {activeModal === 'senate' && (
                <SenateAssistant
                  patient={patient}
                  representative={representative}
                  medicalCase={medicalCase}
                  applications={localApplications}
                  onSaveApplications={handleSaveApplications}
                  language={language}
                />
              )}
              {activeModal === 'pace' && (
                <PACEAssistant
                  patient={patient}
                  representative={representative}
                  medicalCase={medicalCase}
                  language={language}
                />
              )}
              {activeModal === 'lgu_congressional' && (
                <LGUAndCongressionalAssistant
                  patient={patient}
                  representative={representative}
                  medicalCase={medicalCase}
                  applications={localApplications}
                  onSaveApplications={handleSaveApplications}
                  language={language}
                />
              )}
              {activeModal === 'infographic' && (
                <StackingInfographic
                  language={language}
                  onSelectTab={(tab) => {
                    setActiveModal(null);
                    onNavigateToTab(tab);
                  }}
                />
              )}
              {activeModal === 'transfer_rights' && (
                <div className="space-y-6">
                  {/* Top Civic Advisory Banner */}
                  <div className="p-4.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>{language === 'taglish' ? 'Mahalagang Paalala sa Paglipat' : 'Critical Transfer Advisory'}</span>
                    </div>
                    <p className="text-xs text-amber-950 leading-relaxed">
                      {language === 'taglish'
                        ? 'Ang layunin ng transfer playbook na ito ay mailipat nang ligtas at legal ang pasyente mula sa pribadong ospital patungo sa pampublikong tertiary center bago tuluyang mabaon sa utang (lalo na sa ICU at ventilators). Basahin at sundin ang 5 sunod-sunod na yugto sa ibaba.'
                        : 'This transfer playbook guides safe and lawful inter-hospital transfer from a private hospital to a public tertiary specialty center to stop catastrophic debt accumulation (especially in ICU care). Follow the 5 stages sequentially below.'}
                    </p>
                  </div>

                  {/* 5 Stages Sequence */}
                  <div className="space-y-4">
                    {/* Stage 1 */}
                    <div className="p-4.5 rounded-2xl bg-white border border-[#E2DFD6] shadow-2xs space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          1
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {language === 'taglish'
                            ? 'Stage 1: Clinical Stabilization Clearance (RA 8344 / RA 10932)'
                            : 'Stage 1: Clinical Stabilization Clearance (RA 8344 / RA 10932)'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-8.5">
                        {language === 'taglish'
                          ? 'Ayon sa batas (RA 8344 na inamyendahan ng RA 10932), bawal tanggihan o harangin ang pasyente para sa emergency stabilization kahit walang paunang deposito. Humingi sa attending physician ng "Fit to Transfer" certification bago mag-arrange ng biyahe.'
                          : 'Under RA 8344 (amended by RA 10932), medical facilities cannot refuse emergency stabilization or demand deposits. Ensure the attending physician formally issues a "Fit to Transfer" certification prior to transit.'}
                      </p>
                    </div>

                    {/* Stage 2 */}
                    <div className="p-4.5 rounded-2xl bg-white border border-[#E2DFD6] shadow-2xs space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          2
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {language === 'taglish'
                            ? 'Stage 2: Complete Clinical Records & Itemized SOA'
                            : 'Stage 2: Complete Clinical Records & Itemized SOA'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-8.5">
                        {language === 'taglish'
                          ? 'Kunin agad sa billing at medical records ang certified preliminary Statement of Account (SOA), Medical/Clinical Abstract na pirmado ng doktor (may PRC License No.), at kumpletong kopya ng lab/imaging results.'
                          : 'Secure certified preliminary Statement of Account (SOA), doctor-signed Clinical Abstract with PRC license, and complete diagnostic/imaging results from medical records.'}
                      </p>
                    </div>

                    {/* Stage 3 */}
                    <div className="p-4.5 rounded-2xl border border-[#E2DFD6] border-l-4 border-l-blue-900 bg-[#F3F2EC] text-slate-800 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          3
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{t.transferHotline}</h4>
                          <p className="text-xs text-slate-600">
                            {t.transferDeskHint}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 pl-8.5">
                        {[
                          { name: 'Philippine General Hospital (PGH)', phone: '(02) 8554-8400', desc: 'Apex Tertiary / Indigent Ward' },
                          { name: 'Philippine Heart Center (PHC)', phone: '(02) 8925-2401', desc: 'Cardiovascular Surgery & ICU' },
                          { name: 'National Kidney & Transplant Inst. (NKTI)', phone: '(02) 8981-0300', desc: 'Dialysis & Renal Emergency' },
                          { name: 'Lung Center of the Philippines (LCP)', phone: '(02) 8924-6101', desc: 'Critical Respiratory Care' },
                          { name: 'Philippine Children’s Medical Center (PCMC)', phone: '(02) 8588-9900', desc: 'Pediatric ICU & Surgery' },
                        ].map((target, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-[#E2DFD6] space-y-2 flex flex-col justify-between shadow-2xs">
                            <div>
                              <div className="font-bold text-xs text-slate-900 leading-tight">{target.name}</div>
                              <div className="text-xs text-slate-500 font-normal">{target.desc}</div>
                              <div className="text-xs font-mono font-bold text-blue-900 mt-1">{target.phone}</div>
                            </div>
                            <div className="pt-1 flex items-center gap-1.5">
                              <a
                                href={`tel:${parseDialableNumber(target.phone)}`}
                                className="min-h-[44px] h-11 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs shadow-2xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer focus-ring flex-1"
                              >
                                <Phone className="w-3.5 h-3.5 text-blue-900" />
                                <span>{language === 'taglish' ? 'Tumawag' : 'Call'}</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stage 4 */}
                    <div className="p-4.5 rounded-2xl bg-white border border-[#E2DFD6] shadow-2xs space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          4
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {language === 'taglish'
                            ? 'Stage 4: Settle Private Hospital via RA 9439 Promissory Note + Dispatch Ambulance'
                            : 'Stage 4: Settle Private Hospital via RA 9439 Promissory Note + Dispatch Ambulance'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-8.5">
                        {language === 'taglish'
                          ? 'Kung may natitirang utang sa pribado bago lumabas, mag-execute ng Promissory Note alinsunod sa RA 9439 upang payagang makaalis. Makipag-ugnayan sa City/Municipal DRRMO o Philippine Red Cross para sa libreng transfer ambulance na may paramedic support.'
                          : 'Execute an RA 9439 Promissory Note for any unsettled private bill to authorize release. Coordinate with your City/Municipal DRRMO or Philippine Red Cross for a paramedic-equipped transfer ambulance.'}
                      </p>
                    </div>

                    {/* Stage 5 */}
                    <div className="p-4.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          5
                        </span>
                        <h4 className="text-sm font-bold text-emerald-950">
                          {language === 'taglish'
                            ? 'Stage 5: Immediate Registration at Public DOH Malasakit Desk for 100% Zero-Billing'
                            : 'Stage 5: Immediate Registration at Public DOH Malasakit Desk for 100% Zero-Billing'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pl-8.5">
                        {language === 'taglish'
                          ? 'Pagdating sa pampublikong pasilidad, mag-admit sa charity ward at mag-report agad sa in-hospital Malasakit Center desk dala ang Barangay Indigency. Dito gagamitin ang DOH-MAIP at PCSO allocations para maging 100% Zero-Billing ang lahat ng susunod na gamutan.'
                          : 'Upon admission to the public facility, present your Barangay Indigency at the in-hospital Malasakit Center desk to activate DOH-MAIP and PCSO allocations for 100% Zero-Billing.'}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Row */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        onNavigateToTab('print_forms');
                      }}
                      className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                    >
                      <Printer className="w-4 h-4 text-white" />
                      <span>{language === 'taglish' ? 'I-print ang Pre-Filled Forms' : 'Print Pre-Filled Forms'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                    >
                      <ArrowLeft className="w-4 h-4 text-slate-600" />
                      <span>{language === 'taglish' ? 'Isara at Bumalik' : 'Close and Return'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

  );
}
