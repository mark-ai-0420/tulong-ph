import { PrintablePacketCallout } from '@/components/shared/CivicStepCards';
import { PlainLanguageGlossaryCard, QuickStartActionCard } from '@/components/shared/PlainLanguageGuide';
import React, { useState, useEffect } from 'react';

import { ArrowRight, ArrowLeft, AlertCircle, Building, Building2, Clock, ShieldCheck, ChevronRight, Printer, Copy, Check, ExternalLink, HeartHandshake, Ambulance, FileText, Phone, MapPin, Share2, Layers, Landmark, Search } from 'lucide-react';
import { PatientProfile, RepresentativeProfile, MedicalCase, EmergencyCategory, StoredDocument, ApplicationRecord } from '@/types/assistance';
import { TriageResult } from '@/lib/triageEngine';
import { Language, translations } from '@/lib/i18n';

import { GLCooldownTrackerCard } from './GLCooldownTrackerCard';
import { TreatmentQuotaTrackerCard } from './TreatmentQuotaTrackerCard';
import { GenericPrescriptionGuideCard } from './GenericPrescriptionGuideCard';
import { CrossPillarBridgeCard } from '../shared/CrossPillarBridgeCard';

import { MALASAKIT_CENTERS_DIRECTORY } from '@/lib/data/malasakitCenters';
import { parseDialableNumber } from '@/lib/phoneUtils';
import { DOCUMENT_SLOTS } from '@/lib/documentVault';

import { matchPhilHealthZBenefit } from '@/lib/data/philhealthRates';
import { CANCER_ASSISTANCE_FUND, getCancerAssistanceFundSitesForLocation } from '@/lib/data/cancerAssistanceFund';

interface TriageStep3RoadmapProps {
  setBannerError: React.Dispatch<React.SetStateAction<string | null>>;
  patient: PatientProfile;
  representative: RepresentativeProfile;
  medicalCase: MedicalCase;
  documents: StoredDocument[];
  language: Language;
  onNavigateToTab: (tab: string) => void;
  stepMotionClass: string;
  navigateToStep: (step: number) => void;
  triageResult: TriageResult;
  roadmapSearchQuery: string;
  setRoadmapSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setActiveModal: React.Dispatch<React.SetStateAction<'pcso' | 'senate' | 'pace' | 'lgu_congressional' | 'infographic' | 'transfer_rights' | null>>;
  localApplications: ApplicationRecord[];
  handleSaveApplications: (apps: ApplicationRecord[]) => Promise<void>;
}

interface SpecialtyBenefitGuidanceCardsProps {
  category: EmergencyCategory;
  diagnosis: string;
  region: string;
  province: string;
  language: Language;
}

export function SpecialtyBenefitGuidanceCards({
  category,
  diagnosis,
  region,
  province,
  language,
}: SpecialtyBenefitGuidanceCardsProps) {
  const cancerCase = category === 'chemotherapy' || /\b(cancer|carcinoma|neoplasm|leukemia|leukaemia|lymphoma)\b/i.test(diagnosis);
  const dialysisCase = category === 'dialysis' || /\b(hemodialysis|haemodialysis|peritoneal dialysis|dialysis|capd|apd|pd first)\b/i.test(diagnosis);
  const highCostTest = category === 'laboratory_diagnostics' || /\b(ct|mri|pet|imaging|diagnostic scan|diagnostic imaging)\b/i.test(diagnosis);
  const matchedZBenefit = cancerCase || dialysisCase ? matchPhilHealthZBenefit(diagnosis) : undefined;
  const accessSites = cancerCase
    ? getCancerAssistanceFundSitesForLocation({ region, province }).slice(0, 3)
    : [];

  if (!cancerCase && !dialysisCase && !highCostTest) return null;

  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-2" aria-label="Condition-specific assistance guidance">
      {cancerCase && (
        <section className="min-w-0 rounded-xl border border-blue-200 bg-blue-50/70 p-4 space-y-2">
          <h3 className="text-sm font-bold text-blue-950">PhilHealth Z-Benefit</h3>
          <p className="text-xs leading-relaxed text-blue-950">
            {language === 'taglish'
              ? matchedZBenefit
                ? `${matchedZBenefit.name}: ${matchedZBenefit.amountLabel}. Ipa-confirm sa contracted hospital ang eligibility at pre-authorization. Hindi cash grant ang package.`
                : 'May Z Benefit packages para sa ilang cancer. Ipa-check sa treating team ang diagnosis, stage, contracted provider, at pre-authorization.'
              : matchedZBenefit
                ? `${matchedZBenefit.name}: ${matchedZBenefit.amountLabel}. Ask a contracted hospital to confirm eligibility and pre-authorization. This is not a cash grant.`
                : 'PhilHealth has Z Benefit packages for selected cancers. Ask the treating team to check the diagnosis, stage, contracted provider, and pre-authorization.'}
          </p>
        </section>
      )}

      {cancerCase && (
        <section className="min-w-0 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-2">
          <h3 className="text-sm font-bold text-emerald-950">DOH Cancer Assistance Fund (CAF)</h3>
          <p className="text-xs leading-relaxed text-emerald-950">
            {language === 'taglish'
              ? `${CANCER_ASSISTANCE_FUND.annualAssistanceLimitLabel} para sa eligible na serbisyo. Ina-assess ito ng access site at nakadepende sa rules at pondong available.`
              : `${CANCER_ASSISTANCE_FUND.annualAssistanceLimitLabel} for eligible services. An access site assesses each request under program rules and available funds.`}
          </p>
          {accessSites.length > 0 && (
            <p className="text-xs leading-relaxed text-emerald-950">
              {language === 'taglish' ? 'Mga site sa inyong rehiyon:' : 'Sites listed for your region:'}{' '}
              {accessSites.map((site) => site.hospitalName).join(', ')}
            </p>
          )}
          <a
            href={CANCER_ASSISTANCE_FUND.accessSiteLocatorUrl}
            target="_blank"
            rel="noreferrer"
            className="min-h-[44px] w-fit inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-emerald-950 underline underline-offset-2 focus-ring"
          >
            {language === 'taglish' ? 'Buksan ang DOH site locator' : 'Open the DOH site locator'}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          {accessSites.length === 0 && (
            <p className="text-xs leading-relaxed text-emerald-950">
              {language === 'taglish'
                ? 'Walang site sa napiling rehiyon sa snapshot na ito. I-confirm sa DOH locator ang pinakamalapit na kasalukuyang access site.'
                : 'No site is listed for this region in this snapshot. Use the DOH locator to confirm the nearest current access site.'}
            </p>
          )}
        </section>
      )}

      {dialysisCase && (
        <section className="min-w-0 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <h3 className="text-sm font-bold text-amber-950">{language === 'taglish' ? 'PhilHealth Dialysis Benefits' : 'PhilHealth Dialysis Benefits'}</h3>
          <p className="text-xs leading-relaxed text-amber-950">
            {/peritoneal dialysis|\bcapd\b|\bapd\b|\bpd first\b/i.test(diagnosis)
              ? language === 'taglish'
                ? `Nag-iiba ang peritoneal dialysis package ayon sa edad at daily bag regimen. ${matchedZBenefit?.amountLabel || 'Ipa-confirm sa accredited provider ang rate.'} Ipa-itemize ang anumang hindi sakop.`
                : `Peritoneal dialysis package rates vary by age and daily bag regimen. ${matchedZBenefit?.amountLabel || 'Ask an accredited provider to confirm the rate.'} Request an itemized list of any uncovered items.`
              : language === 'taglish'
                ? '₱6,350 bawat hemodialysis session, hanggang 156 sessions kada taon sa ilalim ng Circular 2024-0023. Ipa-confirm sa dialysis unit ang aprubadong limit at ang mga supply na kasama.'
                : '₱6,350 per hemodialysis session, up to 156 sessions a year under Circular 2024-0023. Ask the dialysis unit to confirm the approved limit and which supplies are included.'}
          </p>
          {!/peritoneal dialysis|\bcapd\b|\bapd\b|\bpd first\b/i.test(diagnosis) && (
            <p className="text-xs leading-relaxed text-amber-950">
              {language === 'taglish'
                ? 'Ipa-check kung may dokumentadong kakulangan sa EPO, dialyzer, iron sucrose, o iba pang reseta. Itanong sa Malasakit, PCSO, o DSWD kung may tulong para rito.'
                : 'Ask whether prescribed EPO, dialyzer, iron sucrose, or other items leave a documented gap. Ask Malasakit, PCSO, or DSWD about help for the uncovered amount.'}
            </p>
          )}
        </section>
      )}

      {highCostTest && (
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-sm font-bold text-slate-900">{language === 'taglish' ? 'Outpatient test quotation' : 'Outpatient test quotations'}</h3>
          <p className="text-xs leading-relaxed text-slate-700">
            {language === 'taglish'
              ? 'Para sa mamahaling outpatient CT, MRI, PET scan, o laboratory, itanong muna kung kailangan ng assistance office ang tatlong kasalukuyang written quotation. Nag-iiba ang checklist kada ahensya.'
              : 'For high-cost outpatient CT, MRI, PET, or laboratory tests, ask the assistance office whether it requires three current written quotations. Checklists vary by agency.'}
          </p>
        </section>
      )}
    </div>
  );
}

export function TriageStep3Roadmap({
  setBannerError,
  patient,
  representative,
  medicalCase,
  documents,
  language,
  onNavigateToTab,
  stepMotionClass,
  navigateToStep,
  triageResult,
  roadmapSearchQuery,
  setRoadmapSearchQuery,
  setActiveModal,
  localApplications,
  handleSaveApplications,
}: TriageStep3RoadmapProps) {
  const t = translations[language];
  // Justification Letter Copy State in Step 3
  const [copiedJustification, setCopiedJustification] = useState<boolean>(false);

  // Philippine Standard Time & Queue Window Tracking
  const [phTime, setPhTime] = useState<string>('');
  const [isMorningQueueWindow, setIsMorningQueueWindow] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setPhTime(new Intl.DateTimeFormat('en-US', options).format(now));

      const manilaHour = parseInt(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Manila',
          hour: 'numeric',
          hour12: false,
        }).format(now),
        10
      );
      const manilaDay = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
      ).getDay();
      const isWeekday = manilaDay >= 1 && manilaDay <= 5;
      setIsMorningQueueWindow(isWeekday && manilaHour >= 7 && manilaHour < 12);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Step 3 In-Situ Hospital Desk Matching
  const matchedMalasakitCenter = React.useMemo(() => {
    if (!medicalCase.hospitalName || !medicalCase.hospitalName.trim()) return null;
    const target = medicalCase.hospitalName.toLowerCase().trim();

    // 1. Exact or startsWith match
    let found = MALASAKIT_CENTERS_DIRECTORY.find(
      (c) => c.hospitalName.toLowerCase() === target || target.startsWith(c.hospitalName.toLowerCase())
    );
    if (found) return found;

    // 2. Substring / clean name match
    found = MALASAKIT_CENTERS_DIRECTORY.find((c) => {
      const cName = c.hospitalName.toLowerCase();
      const cleanC = cName.replace(/\s*\([^)]*\)/g, '').trim();
      return cName.includes(target) || (cleanC.length > 3 && target.includes(cleanC));
    });
    if (found) return found;

    // 3. Alias or acronym match
    found = MALASAKIT_CENTERS_DIRECTORY.find((c) => {
      if (c.aliases?.some((a) => target.includes(a.toLowerCase()) || a.toLowerCase().includes(target))) {
        return true;
      }
      const match = c.hospitalName.match(/\(([^)]+)\)/);
      if (match && match[1]) {
        const acronym = match[1].toLowerCase();
        if (target.includes(acronym)) return true;
      }
      return false;
    });
    return found || null;
  }, [medicalCase.hospitalName]);

  // Step 3 Feedback & Actions State
  const [copiedCenterPhone, setCopiedCenterPhone] = useState<boolean>(false);
  const [copiedChecklist, setCopiedChecklist] = useState<boolean>(false);

  const handleCopyCenterPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedCenterPhone(true);
    setTimeout(() => setCopiedCenterPhone(false), 2000);
  };

  const handleShareChecklist = async () => {
    if (!triageResult) return;

    const patientName = `${patient.firstName} ${patient.lastName}`.trim() || (language === 'taglish' ? 'Pasyente' : 'Patient');
    const hospital = medicalCase.hospitalName || (language === 'taglish' ? 'Ospital' : 'Hospital');
    const netBal = medicalCase.netRemainingBalance.toLocaleString();

    const docListFormatted = triageResult.allRequiredDocuments
      .map((docType, idx) => {
        const slot = DOCUMENT_SLOTS.find((s) => s.type === docType);
        const label = language === 'taglish' ? slot?.labelTl || docType : slot?.labelEn || docType;
        const isReady = documents.some((d) => d.docType === docType);
        return `${idx + 1}. [${isReady ? '✓ Handa na' : 'Kailangan'}] ${label}`;
      })
      .join('\n');

    const shareText = language === 'taglish'
      ? `📋 TulongPH Medical Checklist\nPara kay: ${patientName}\nOspital: ${hospital}\nBalanse sa Bill: ₱${netBal}\n\nMga Kailangang Dokumento:\n${docListFormatted}\n\n💡 Paalala: Siguraduhing malinaw ang bawat kopya at hindi lalampas sa 2MB ang bawat PDF file para sa PCSO at Senado.\nMag-organisa sa: https://tulongph.vercel.app`
      : `📋 TulongPH Medical Checklist\nPatient: ${patientName}\nHospital: ${hospital}\nRemaining Bill: ₱${netBal}\n\nRequired Documents:\n${docListFormatted}\n\n💡 Reminder: Ensure all scans/photos are clear and under 2MB PDF per file for PCSO & Senate.\nOrganize at: https://tulongph.vercel.app`;

    const shareData = {
      title: 'TulongPH Medical Checklist',
      text: shareText,
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedChecklist(true);
      setTimeout(() => setCopiedChecklist(false), 2500);
    } catch (e) {
      console.error('Failed to copy checklist to clipboard', e);
    }
  };

  // Pre-formatted Senate justification generator
  const patientFullName = `${patient.firstName} ${patient.middleName} ${patient.lastName}`.trim();
  const representativeName = representative.isPatientHimself
    ? patientFullName
    : representative.fullName;

  const formatRelationshipForLetter = (raw: string, isSelf: boolean, lang: 'tl' | 'en') => {
    if (isSelf) return lang === 'tl' ? 'sarili' : 'myself';
    if (!raw || raw === 'Iba pa / Other') return lang === 'tl' ? 'kapamilya' : 'relative';
    if (raw.includes(' / ')) {
      const [tl, en] = raw.split(' / ');
      return lang === 'tl' ? tl.toLowerCase() : en.toLowerCase();
    }
    return raw;
  };

  const relationshipLabelTl = formatRelationshipForLetter(
    representative.relationshipToPatient,
    representative.isPatientHimself,
    'tl'
  );
  const relationshipLabelEn = formatRelationshipForLetter(
    representative.relationshipToPatient,
    representative.isPatientHimself,
    'en'
  );

  const formalJustificationTl = `Ako po si ${representativeName}, lumalapit sa Kagalang-galang na Senado ng Pilipinas upang humingi ng tulong medikal sa pamamagitan ng Guarantee Letter (GL) para sa aking ${relationshipLabelTl} na si ${patientFullName}. Siya po ay kasalukuyang sumasailalim sa gamutan sa ${
    medicalCase.hospitalName || 'ospital'
  } dahil sa ${medicalCase.diagnosis || 'sakit'}. Ang aming natitirang babayarin matapos ang PhilHealth deduction ay humigit-kumulang ₱${medicalCase.netRemainingBalance.toLocaleString()}. Dahil po sa kakapusan sa pananalapi, labis po kaming umaasa sa inyong tanggapan upang maibsan ang aming bayarin. Maraming salamat po sa inyong malasakit.`;

  const formalJustificationEn = `I am writing to formally request medical assistance via a Guarantee Letter (GL) from the Senate Public Assistance Office on behalf of my ${relationshipLabelEn}, ${patientFullName}. The patient is currently receiving treatment at ${
    medicalCase.hospitalName || 'the hospital'
  } for ${medicalCase.diagnosis || 'medical condition'}. Our remaining balance after PhilHealth case rate deductions stands at ₱${medicalCase.netRemainingBalance.toLocaleString()}. Given our limited household financial resources, any assistance granted will go a long way in ensuring continued medical care. Thank you very much for your public service.`;

  const justification = language === 'taglish' ? formalJustificationTl : formalJustificationEn;

  const copyJustification = () => {
    navigator.clipboard.writeText(justification);
    setCopiedJustification(true);
    setTimeout(() => setCopiedJustification(false), 2000);
  };

  const sharedFamilyContext = {
    province: patient.address.province,
    cityMunicipality: patient.address.cityMunicipality,
    barangay: patient.address.barangay,
    region: patient.address.region,
    is4Ps: patient.is4PsBeneficiary,
    isPWD: patient.isPWD,
    isOFW: patient.isOFWOrDependent,
    isSoloParent: patient.isSoloParent ?? false,
    isSeniorCitizen: patient.isSeniorCitizen,
    monthlyIncome: patient.monthlyHouseholdIncome,
    sourcePillar: 'medical' as const,
  };
  const isMedicalSicknessCase = ['hospitalization', 'surgery_implants', 'dialysis', 'chemotherapy'].includes(medicalCase.category);
  const showEducationBridge = medicalCase.category === 'burial_funeral' || patient.is4PsBeneficiary || patient.isSoloParent || patient.socioeconomicClass === 'indigent';

  return (
        <div className={`space-y-6 ${stepMotionClass}`}>
          <QuickStartActionCard pillar="medical" language={language} scenario={medicalCase.category}
            organizationName={medicalCase.hospitalName} isPrivateHospital={medicalCase.hospitalType === 'private'}
            hasMalasakitCenter={medicalCase.hasMalasakitCenter} />
          <PlainLanguageGlossaryCard pillar="medical" language={language} />

          {/* Summary Box */}
          <div className="bg-white border border-[#E2DFD6] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-200 inline-block">
                    OPTIMIZED SEQUENCE READY
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveModal('infographic')}
                    className="min-h-[44px] px-3 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 font-bold text-xs border border-blue-200 shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-900" />
                    <span>{language === 'taglish' ? 'Tingnan ang Visual Infographic' : 'View Visual Infographic'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal('lgu_congressional')}
                    className="min-h-[44px] px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-bold text-xs border border-emerald-200 shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-emerald-800" />
                    <span>{language === 'taglish' ? 'Buksan ang LGU & Congressional Assistant' : 'Open LGU & Congressional Assistant'}</span>
                  </button>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {medicalCase.hospitalType === 'private'
                    ? medicalCase.privateStrategy === 'transfer_referral'
                      ? 'Emergency-to-Public Transfer Protocol (Zero-Bankruptcy Route)'
                      : (language === 'taglish'
                          ? 'Private Hospital Credit & Collection Roadmap (35%–70% Bawas)'
                          : 'Private Hospital Credit & Collection Roadmap (35%–70% Reduction)')
                    : (language === 'taglish'
                        ? 'Ang Inyong Public Hospital Zero-Billing Roadmap'
                        : 'Your Public Hospital Zero-Billing Roadmap')}
                </h2>
                <p className="text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
                  {language === 'taglish'
                    ? triageResult.recommendedOrderSummaryTl
                    : triageResult.recommendedOrderSummaryEn}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Estimated Bill Reduction
                </div>
                <div className="tabular-nums text-lg font-bold text-emerald-800 mt-0.5">
                  {triageResult.estimatedCoverageRange}
                </div>
              </div>
            </div>

            {/* Official Assistance Stacking Sequence Architecture Display */}
            <div className="pt-5 border-t border-[#E2DFD6] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === 'taglish'
                    ? 'Tamang Pagkasunod-sunod ng Paglapit (5-Pillar Aid Stacking):'
                    : 'Official Assistance Stacking Sequence (5 Pillars):'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="min-w-0 space-y-2 relief-pillar motion-reduce:animate-none motion-reduce:delay-0" style={{ animationDelay: '0ms' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      1
                    </span>
                    <span className="text-xs font-bold text-slate-900">PhilHealth</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {language === 'taglish'
                      ? 'Unang bawas sa billing desk bago ang lahat.'
                      : 'Mandatory first deduction at billing desk.'}
                  </p>
                </div>

                <div className="min-w-0 space-y-2 relief-pillar motion-reduce:animate-none motion-reduce:delay-0" style={{ animationDelay: '50ms' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      2
                    </span>
                    <span className="text-xs font-bold text-slate-900">Senior/PWD 20%</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {language === 'taglish'
                      ? 'Diskwento sa doctor fee at gamot (RA 9994/10754).'
                      : '20% off + VAT free on medicines & MD fees.'}
                  </p>
                </div>

                <div className="min-w-0 space-y-2 relief-pillar motion-reduce:animate-none motion-reduce:delay-0" style={{ animationDelay: '100ms' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      3
                    </span>
                    <span className="text-xs font-bold text-slate-900">Malasakit Center</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {language === 'taglish'
                      ? 'In-hospital desk (DOH MAIP) para sa ward at gamot.'
                      : 'In-hospital DOH MAIP desk for ward & meds.'}
                  </p>
                </div>

                <div className="min-w-0 space-y-2 relief-pillar motion-reduce:animate-none motion-reduce:delay-0" style={{ animationDelay: '150ms' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      4
                    </span>
                    <span className="text-xs font-bold text-slate-900">PCSO / PACe</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {language === 'taglish'
                      ? 'GL para sa malaking bill (₱50k+), chemo, o implants.'
                      : 'GL for catastrophic bill (₱50k+), chemo, or implants.'}
                  </p>
                </div>

                <div className="min-w-0 space-y-2 relief-pillar motion-reduce:animate-none motion-reduce:delay-0" style={{ animationDelay: '200ms' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      5
                    </span>
                    <span className="text-xs font-bold text-slate-900">DSWD AICS (Cash)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {language === 'taglish'
                      ? 'Cash aid sa gamot sa labas, pamasahe, o libing.'
                      : 'Outright cash for outside pharmacy & travel.'}
                  </p>
                </div>
              </div>
            </div>

            <SpecialtyBenefitGuidanceCards
              category={medicalCase.category}
              diagnosis={medicalCase.diagnosis}
              region={patient.address.region}
              province={patient.address.province}
              language={language}
            />

            {/* Admission Status Operational Guidance Banner */}
            {triageResult.admissionStatusGuidance && (
              <div className="p-4 rounded-xl border border-[#E2DFD6] border-l-4 border-l-blue-900 bg-[#F3F2EC] text-xs text-slate-800 flex items-start gap-3 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold uppercase tracking-wider text-blue-900 block text-xs">
                    {language === 'taglish'
                      ? triageResult.admissionStatusGuidance.titleTl
                      : triageResult.admissionStatusGuidance.titleEn}
                  </span>
                  <p className="leading-relaxed font-medium">
                    {language === 'taglish'
                      ? triageResult.admissionStatusGuidance.adviceTl
                      : triageResult.admissionStatusGuidance.adviceEn}
                  </p>
                </div>
              </div>
            )}

            {/* Instant Roadmap Search & Filter Bar */}
            <div className="space-y-2">
              <div className="relative">
                <label htmlFor="roadmap-search" className="sr-only">
                  {t.roadmapSearchPlaceholder}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="roadmap-search"
                    type="text"
                    autoComplete="off"
                    value={roadmapSearchQuery}
                    onChange={(e) => setRoadmapSearchQuery(e.target.value)}
                    placeholder={t.roadmapSearchPlaceholder}
                    className="w-full h-11 min-h-11 pl-10 pr-10 py-2.5 rounded-xl border border-[#E2DFD6] text-xs sm:text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  {roadmapSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setRoadmapSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 1-Tap Quick Filter Chips for Non-Tech & Senior Users */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'taglish' ? 'Mabilisang Salain:' : 'Quick Filters:'}
                </span>
                {[
                  { label: 'Lahat', query: '' },
                  { label: 'PhilHealth', query: 'PhilHealth' },
                  { label: 'Malasakit', query: 'Malasakit' },
                  { label: 'PCSO', query: 'PCSO' },
                  { label: 'Senado', query: 'Senado' },
                  { label: 'DSWD (Gamot)', query: 'DSWD' },
                  { label: 'PACe', query: 'PACe' },
                ].map((chip) => {
                  const isActive =
                    chip.query === '' ? !roadmapSearchQuery : roadmapSearchQuery.toLowerCase() === chip.query.toLowerCase();
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setRoadmapSearchQuery(chip.query)}
                      className={`min-h-[44px] px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                          : 'bg-white hover:bg-stone-50 text-slate-700 border-[#E2DFD6]'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Critical Warnings if any */}
            {triageResult.criticalWarningsEn.length > 0 && (
              <div className="border-t border-slate-200 pt-3 space-y-2">
                {(language === 'taglish'
                  ? triageResult.criticalWarningsTl
                  : triageResult.criticalWarningsEn
                ).map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Public vs. Private Hospital Customization Card */}
          {medicalCase.hospitalType !== 'private' ? (
            /* PUBLIC HOSPITALS (DOH / LGU): In-Situ Malasakit Center Desk Card */
            matchedMalasakitCenter ? (
              <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {language === 'taglish' ? 'In-Situ Malasakit Center Desk' : 'In-Situ Malasakit Center Desk'}
                        </h3>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                          Matched Facility
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        {matchedMalasakitCenter.hospitalType}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">
                      {matchedMalasakitCenter.hospitalName}
                    </span>
                    <div className="flex items-start gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-blue-900 shrink-0 mt-0.5" />
                      <span>{matchedMalasakitCenter.address} ({matchedMalasakitCenter.provinceOrCity})</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block text-xs">
                      {language === 'taglish' ? 'Oras ng Operasyon:' : 'Operating Hours:'}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                      <span>{matchedMalasakitCenter.operatingHours}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={`tel:${parseDialableNumber(matchedMalasakitCenter.contactNumber)}`}
                    className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                  >
                    <Phone className="w-4 h-4" />
                    <span>
                      {language === 'taglish'
                        ? `Tawagan ang Desk: ${matchedMalasakitCenter.contactNumber}`
                        : `Call Desk: ${matchedMalasakitCenter.contactNumber}`}
                    </span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyCenterPhone(matchedMalasakitCenter.contactNumber)}
                    className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                  >
                    {copiedCenterPhone ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>{language === 'taglish' ? 'Na-kopya na!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-600" />
                        <span>{language === 'taglish' ? 'Kopyahin ang Telepono' : 'Copy Phone Number'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToTab('print_forms')}
                    className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-blue-900 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                  >
                    <Printer className="w-4 h-4 text-blue-900" />
                    <span>{language === 'taglish' ? 'I-print ang Malasakit Form' : 'Print Malasakit Form'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    {language === 'taglish'
                      ? `Magtungo sa Medical Social Services ng ${medicalCase.hospitalName || 'ospital'} para sa DOH-MAIP zero-billing evaluation.`
                      : `Visit the Medical Social Services of ${medicalCase.hospitalName || 'the hospital'} for DOH-MAIP zero-billing evaluation.`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('malasakit')}
                  className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring shrink-0 self-start sm:self-auto"
                >
                  <span>{language === 'taglish' ? 'Direktoryo ng Malasakit' : 'Malasakit Directory'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )
          ) : medicalCase.privateStrategy === 'transfer_referral' ? (
            /* PRIVATE HOSPITALS (transfer_referral): 5-Stage Inter-Hospital Transfer Playbook */
            <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'taglish'
                      ? '5-Stage Inter-Hospital Transfer Playbook (Zero-Bankruptcy Route)'
                      : '5-Stage Inter-Hospital Transfer Playbook (Zero-Bankruptcy Route)'}
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                    Protocol Playbook
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {language === 'taglish'
                    ? 'Hakbang-hakbang na gabay para sa ligtas at legal na paglipat mula pribado patungo sa pampublikong specialty hospital upang maiwasan ang nakalulubog na utang sa ICU.'
                    : 'Step-by-step clinical and administrative roadmap for emergency inter-hospital transfer to public tertiary centers to halt runaway private debt.'}
                </p>
              </div>

              <div className="space-y-4">
                {/* Stage 1 */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      1
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      Stage 1: Clinical Stabilization Clearance (RA 8344 / RA 10932)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-8">
                    {language === 'taglish'
                      ? 'Ayon sa batas (RA 8344 na inamyendahan ng RA 10932), bawal tanggihan o harangin ang pasyente para sa emergency stabilization kahit walang paunang deposito. Humingi sa attending physician ng "Fit to Transfer" certification bago mag-arrange ng biyahe.'
                      : 'Under RA 8344 (amended by RA 10932), medical facilities cannot refuse emergency stabilization or demand deposits. Ensure the attending physician formally issues a "Fit to Transfer" certification prior to transit.'}
                  </p>
                </div>

                {/* Stage 2 */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      2
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      Stage 2: Complete Clinical Records & Itemized SOA
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-8">
                    {language === 'taglish'
                      ? 'Kunin agad sa billing at medical records ang certified preliminary Statement of Account (SOA), Medical/Clinical Abstract na pirmado ng doktor (may PRC License No.), at kumpletong kopya ng lab/imaging results.'
                      : 'Secure certified preliminary Statement of Account (SOA), doctor-signed Clinical Abstract with PRC license, and complete diagnostic/imaging results from medical records.'}
                  </p>
                </div>

                {/* Stage 3 */}
                <div className="p-4 rounded-xl border border-[#E2DFD6] border-l-4 border-l-blue-900 bg-[#F3F2EC] text-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      3
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {t.transferHotline}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {t.transferDeskHint}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 pl-8">
                    {[
                      { name: 'Philippine General Hospital (PGH)', phone: '(02) 8554-8400', desc: 'Apex Tertiary / Indigent Ward' },
                      { name: 'Philippine Heart Center (PHC)', phone: '(02) 8925-2401', desc: 'Cardiovascular Surgery & ICU' },
                      { name: 'National Kidney & Transplant Inst. (NKTI)', phone: '(02) 8981-0300', desc: 'Dialysis & Renal Emergency' },
                      { name: 'Lung Center of the Philippines (LCP)', phone: '(02) 8924-6101', desc: 'Critical Respiratory Care' },
                      { name: 'Philippine Children’s Medical Center (PCMC)', phone: '(02) 8588-9900', desc: 'Pediatric ICU & Surgery' },
                    ].map((target, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 flex flex-col justify-between">
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
                            <span>Tumawag</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      4
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      Stage 4: Settle Private Hospital via RA 9439 Promissory Note + Dispatch Ambulance
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-8">
                    {language === 'taglish'
                      ? 'Kung may natitirang utang sa pribado bago lumabas, mag-execute ng Promissory Note alinsunod sa RA 9439 upang payagang makaalis. Makipag-ugnayan sa City/Municipal DRRMO o Philippine Red Cross para sa libreng transfer ambulance na may paramedic support.'
                      : 'Execute an RA 9439 Promissory Note for any unsettled private bill to authorize release. Coordinate with your City/Municipal DRRMO or Philippine Red Cross for a paramedic-equipped transfer ambulance.'}
                  </p>
                </div>

                {/* Stage 5 */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      5
                    </span>
                    <h4 className="text-sm font-bold text-emerald-950">
                      Stage 5: Immediate Registration at Public DOH Malasakit Desk for 100% Zero-Billing
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed pl-8">
                    {language === 'taglish'
                      ? 'Pagdating sa pampublikong pasilidad, mag-admit sa charity ward at mag-report agad sa in-hospital Malasakit Center desk dala ang Barangay Indigency. Dito gagamitin ang DOH-MAIP at PCSO allocations para maging 100% Zero-Billing ang lahat ng susunod na gamutan.'
                      : 'Upon admission to the public facility, present your Barangay Indigency at the in-hospital Malasakit Center desk to activate DOH-MAIP and PCSO allocations for 100% Zero-Billing.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* PRIVATE HOSPITALS (gl_stacking): Gabay sa Pribadong Ospital (What's In & What's Out) Card */
            <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {language === 'taglish'
                        ? "Gabay sa Pribadong Ospital (What's In & What's Out)"
                        : "Private Hospital Guide (What's In & What's Out)"}
                    </h3>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 border border-blue-200">
                      RA 11463 & RA 9439
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {language === 'taglish'
                      ? 'Alamin ang inyong mga legal na karapatan at mga limitasyon sa pagsingil sa pribadong ospital.'
                      : 'Understand your statutory entitlements and billing limitations inside private healthcare facilities.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveModal('transfer_rights')}
                    className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                  >
                    <Ambulance className="w-4 h-4 text-emerald-700" />
                    <span>{language === 'taglish' ? 'Transfer Playbook' : 'Transfer Playbook'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('print_forms')}
                    className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-blue-900 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                  >
                    <Printer className="w-4 h-4 text-blue-900" />
                    <span>{language === 'taglish' ? 'I-print ang Forms' : 'Print Forms'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ❌ Hindi Saklaw */}
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-xs">✕</span>
                    <span>{language === 'taglish' ? 'Hindi Saklaw sa Pribado' : "What's NOT Covered"}</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold shrink-0">•</span>
                      <span>
                        <strong>Walang Malasakit Center desk sa pribado:</strong> Ayon sa RA 11463, eksklusibo lamang ang mga Malasakit Center desks sa mga pampublikong ospital ng DOH at LGU.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold shrink-0">•</span>
                      <span>
                        <strong>Walang No-Balance-Billing (NBB):</strong> Hindi mandatory ang zero balance sa private rooms (semi-private, private, suite) o private accommodations.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold shrink-0">•</span>
                      <span>
                        <strong>Hiwalay ang singil ng doktor (PF):</strong> Ang Professional Fees ng mga private attending physician ay hiwalay sa hospital bill at madalas hindi sakop ng government GLs maliban kung may espesyal na waiver.
                      </span>
                    </li>
                  </ul>
                </div>

                {/* ✅ May Karapatan */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs">✓</span>
                    <span>{language === 'taglish' ? 'May Karapatan Ka sa Batas' : "Your Statutory Rights (What's In)"}</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="tabular-nums text-emerald-700 font-bold shrink-0">•</span>
                      <span>
                        <strong>PhilHealth Case Rates:</strong> Awtomatikong statutory deduction sa bill bago kwentahin ang anumang diskwento o bayarin.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="tabular-nums text-emerald-700 font-bold shrink-0">•</span>
                      <span>
                        <strong>Senior/PWD 20% + 12% VAT Exemption:</strong> MANDATORY BY LAW (RA 9994 / RA 10754) sa room, laboratory, diagnostic tests, gamot, at doktor Professional Fees (PF).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="tabular-nums text-emerald-700 font-bold shrink-0">•</span>
                      <span>
                        <strong>PCSO Guarantee Letter:</strong> Tanggap sa mga pribadong ospital na may aktibong MOA para sa chemo, dialysis, at operasyon.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="tabular-nums text-emerald-700 font-bold shrink-0">•</span>
                      <span>
                        <strong>PACe Malacañang & Senate GL:</strong> Maaring mag-isyu ng Guarantee Letter para sa malalaking deficit (₱50k+) kung accredited ang pribadong pasilidad.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="tabular-nums text-emerald-700 font-bold shrink-0">•</span>
                      <span>
                        <strong>DSWD AICS Direct Cash:</strong> Outright cash para sa mga mamahaling gamot na kailangang bilhin sa labas na generic pharmacies.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 🛡️ Proteksyon: Promissory Note Literacy under RA 9439 */}
              <div className="p-4 rounded-xl border border-[#E2DFD6] border-l-4 border-l-blue-900 bg-[#F3F2EC] text-xs text-slate-800 flex items-start gap-3 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold uppercase tracking-wider text-blue-900 block text-xs">
                    Proteksyon sa ilalim ng RA 9439 (Anti-Hospital Detention Act)
                  </span>
                  <p className="leading-relaxed">
                    {language === 'taglish'
                      ? 'Ipinagbabawal ng batas ang pagharang o pag-detain sa pasyente, o pagtangging maglabas ng medical certificate at discharge slip dahil sa hindi pa nababayarang bill. May legal na karapatan ang pasyente (lalo na sa non-private ward/bed) na makalabas sa pamamagitan ng paglagda sa isang Promissory Note na may kaukulang guarantor o mortgage/collateral.'
                      : 'Under RA 9439 (Anti-Hospital Detention Act), it is strictly illegal for hospitals to detain patients or withhold medical/discharge clearances due to unpaid balances. Patients admitted in non-private accommodations are legally entitled to execute a Promissory Note secured by a co-maker/guarantor or collateral.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <PrintablePacketCallout language={language} title={language === 'taglish' ? 'Kailangan ng Pisikal na Papel sa Social Worker Desk?' : 'Physical Forms Needed at the Hospital Desk?'} description={language === 'taglish' ? 'I-print ang pre-filled na Malasakit Unified Intake Sheet at DSWD AICS Certificate of Eligibility para may dalang kumpletong papel sa social worker.' : 'Download and print pre-filled Malasakit Unified Intake Sheets and DSWD AICS Certificates ready for social worker desks.'} buttonLabel={language === 'taglish' ? 'Mag-print ng Malasakit & DSWD Forms' : 'Print Malasakit & DSWD Forms (PDF)'} onPrint={() => onNavigateToTab('print_forms')} />

          {/* Stacking Steps List with Consolidated Agency Trackers */}
          <div className="space-y-4">
            {(() => {
              const query = roadmapSearchQuery.trim().toLowerCase();
              const filteredSteps = query
                ? triageResult.steps.filter((s) => {
                    const agencyMatch = s.agencyName.toLowerCase().includes(query);
                    const titleTlMatch = s.actionTitleTl.toLowerCase().includes(query);
                    const titleEnMatch = s.actionTitleEn.toLowerCase().includes(query);
                    const explTlMatch = s.explanationTl.toLowerCase().includes(query);
                    const explEnMatch = s.explanationEn.toLowerCase().includes(query);
                    const targetMatch = (s.targetExpense || '').toLowerCase().includes(query);
                    return agencyMatch || titleTlMatch || titleEnMatch || explTlMatch || explEnMatch || targetMatch;
                  })
                : triageResult.steps;

              if (filteredSteps.length === 0) {
                return (
                  <div className="p-8 text-center bg-white rounded-2xl border border-[#E2DFD6] space-y-2">
                    <p className="text-sm font-bold text-slate-800">
                      {language === 'taglish'
                        ? `Walang nakitang tulong para sa "${roadmapSearchQuery}"`
                        : `No assistance steps found matching "${roadmapSearchQuery}"`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {language === 'taglish'
                        ? 'Subukang mag-search gamit ang ibang salita (hal. PhilHealth, PCSO, Malasakit, DSWD, gamot).'
                        : 'Try searching for other terms like PhilHealth, PCSO, Malasakit, DSWD, or medicines.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setRoadmapSearchQuery('')}
                      className="mt-2 text-xs font-bold text-blue-900 underline cursor-pointer"
                    >
                      {language === 'taglish' ? 'Ipakita ang lahat ng hakbang' : 'Show all steps'}
                    </button>
                  </div>
                );
              }

              return filteredSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="bg-white rounded-2xl border border-[#E2DFD6] p-6 shadow-xs transition-all hover:border-blue-300"
                >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      #{step.stepNumber}
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                        {step.agencyName}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {language === 'taglish' ? step.actionTitleTl : step.actionTitleEn}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 pl-11 sm:pl-0">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <Clock className="w-4 h-4 text-blue-900" />
                      {step.estimatedTime}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed pl-11 font-normal">
                  {language === 'taglish' ? step.explanationTl : step.explanationEn}
                </p>

                {/* Consolidated Tracker: PCSO 7:00 AM Queue Window & 2.0MB Single-PDF Checklist */}
                {step.agencyId === 'pcso_map' && (
                  <div className="pl-11 mt-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Philippine Standard Time (GMT+8)
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              isMorningQueueWindow
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                : 'bg-amber-100 text-amber-950 border-amber-300'
                            }`}
                          >
                            {isMorningQueueWindow ? 'Queue Active' : 'Standby'}
                          </span>
                        </div>
                        <div className="text-xl font-bold text-slate-900 mt-1">{phTime || 'Loading...'}</div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed font-normal">
                          {isMorningQueueWindow
                            ? (language === 'taglish'
                                ? 'Bukas ang online submission portal ngayon hanggang 12:00 PM.'
                                : 'Online submission portal is open today until 12:00 PM.')
                            : (language === 'taglish'
                                ? 'Lunes hanggang Biyernes, 7:00 AM - 12:00 PM ang filing window.'
                                : 'Weekdays 7:00 AM - 12:00 PM online submission window.')}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                          2.0MB Single-PDF Checklist
                        </div>
                        <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside font-normal">
                          <li>Original Medical Abstract (Signed with PRC License No.)</li>
                          <li>Statement of Account (Net of PhilHealth & Discounts)</li>
                          <li>Valid Government ID ng Pasyente at Kinatawan</li>
                          <li>Signed Authorization Letter & Katunayan ng Relasyon</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Consolidated Tracker: Senate Assist 90-Day Policy & 1-Click Justification */}
                {step.agencyId === 'senate_assist' && (
                  <div className="pl-11 mt-4 space-y-3">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            {language === 'taglish' ? 'Pre-Formatted na Sulat ng Kahilingan:' : 'Pre-Formatted Justification Letter:'}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-950 border border-blue-200">
                            90-Day Cooldown Policy
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={copyJustification}
                          className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring self-start sm:self-auto"
                        >
                          {copiedJustification ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>{language === 'taglish' ? 'Na-kopya na!' : 'Copied!'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-slate-600" />
                              <span>{language === 'taglish' ? 'Kopyahin ang Sulat' : 'Copy Letter'}</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 italic bg-white p-3.5 rounded-lg border border-slate-200 leading-relaxed font-normal">
                        &ldquo;{justification}&rdquo;
                      </p>
                      <p className="text-xs text-slate-600 font-normal">
                        {language === 'taglish'
                          ? 'Tandaan: Ang tulong medikal sa pamamagitan ng Guarantee Letter ay maaari lamang ma-avail kada 90 araw para sa parehong pasyente.'
                          : 'Note: Senate medical assistance Guarantee Letters require a 90-day cooldown between requests for the same patient.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Consolidated Tracker: PACe Malacañang Transmittal Guide */}
                {step.agencyId === 'pace_op' && (
                  <div className="pl-11 mt-4 space-y-3">
                    <div className="p-4 rounded-xl border border-[#E2DFD6] border-l-4 border-l-blue-900 bg-[#F3F2EC] text-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-blue-900" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Malacañang Transmittal Guide
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-800 border border-[#E2DFD6]">
                          Bills ₱50,000+ / ICU / Implants
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        {language === 'taglish'
                          ? 'Tanggapan ng Pangulo (Malacañang) para sa malalaking deficit sa operasyon at ICU na lumagpas sa limit ng Malasakit at PCSO. Ipadala ang requirements sa pace@op.gov.ph o dalhin sa Malacañang PACe Desk.'
                          : 'Office of the President (Malacañang) lifeline for catastrophic surgical deficits and ICU balances exceeding Malasakit and PCSO limits. Submit to pace@op.gov.ph or at the Malacañang PACe Desk.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Target Expense & Standardized Action Launchers */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200 pl-11">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-800">Target Expense:</span>{' '}
                    {step.targetExpense}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* PCSO Actions */}
                    {step.agencyId === 'pcso_map' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveModal('pcso')}
                          className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                        >
                          <HeartHandshake className="w-4 h-4" />
                          <span>{language === 'taglish' ? 'Buksan ang PCSO Assistant' : 'Open PCSO Assistant'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <a
                          href="https://www.pcso.gov.ph"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                        >
                          <span>{language === 'taglish' ? 'Buksan ang external portal (pcso.gov.ph)' : 'Open external portal (pcso.gov.ph)'}</span>
                          <ExternalLink className="w-4 h-4 text-slate-600" />
                        </a>
                      </>
                    )}

                    {/* Senate Actions */}
                    {step.agencyId === 'senate_assist' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveModal('senate')}
                          className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{language === 'taglish' ? 'Buksan ang Senate Helper' : 'Open Senate Helper'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <a
                          href="https://assist.senate.gov.ph"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                        >
                          <span>{language === 'taglish' ? 'Buksan ang external portal (assist.senate.gov.ph)' : 'Open external portal (assist.senate.gov.ph)'}</span>
                          <ExternalLink className="w-4 h-4 text-slate-600" />
                        </a>
                      </>
                    )}

                    {/* PACe Actions */}
                    {step.agencyId === 'pace_op' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveModal('pace')}
                          className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                        >
                          <Landmark className="w-4 h-4 text-amber-300" />
                          <span>{language === 'taglish' ? 'Buksan ang PACe Toolkit' : 'Open PACe Toolkit'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <a
                          href="mailto:pace@op.gov.ph"
                          className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                        >
                          <span>{language === 'taglish' ? 'Email sa pace@op.gov.ph' : 'Email pace@op.gov.ph'}</span>
                          <ExternalLink className="w-4 h-4 text-slate-600" />
                        </a>
                      </>
                    )}

                    {/* Malasakit Actions */}
                    {step.agencyId === 'doh_malasakit' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('print_forms')}
                          className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                        >
                          <Printer className="w-4 h-4" />
                          <span>{language === 'taglish' ? 'Mag-print ng Forms' : 'Print Forms'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('malasakit')}
                          className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                        >
                          <span>{language === 'taglish' ? 'Tingnan ang Direktoryo ng Malasakit' : 'Browse Malasakit Desks'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* DSWD Actions */}
                    {step.agencyId === 'dswd_aics' && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTab('print_forms')}
                        className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
                      >
                        <Printer className="w-4 h-4" />
                        <span>{language === 'taglish' ? 'Mag-print ng DSWD Forms' : 'Print DSWD Forms'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>

          {/* Required Documents Checklist with 1-Tap Web Share */}
          {triageResult.allRequiredDocuments && triageResult.allRequiredDocuments.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {language === 'taglish'
                        ? 'Listahan ng mga Kailangang Dokumento'
                        : 'Required Documents Checklist'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 max-w-2xl">
                    {language === 'taglish'
                      ? 'Ihanda at i-scan ang mga dokumentong ito upang mabilis na maaprubahan ang inyong mga Guarantee Letter sa bawat ahensya.'
                      : 'Prepare and scan these documents to expedite Guarantee Letter processing across all assigned agencies.'}
                  </p>
                </div>

                {/* 1-Tap Web Share Button */}
                <button
                  type="button"
                  onClick={handleShareChecklist}
                  className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring shrink-0"
                >
                  {copiedChecklist ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>{language === 'taglish' ? 'Na-kopya ang Checklist!' : 'Checklist Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>
                        {language === 'taglish'
                          ? 'I-share ang Checklist sa Messenger / Viber'
                          : 'Share Checklist to Messenger / Viber'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Checklist Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {triageResult.allRequiredDocuments.map((docType) => {
                  const slot = DOCUMENT_SLOTS.find((s) => s.type === docType);
                  const isUploaded = documents.some((d) => d.docType === docType);
                  const title = language === 'taglish' ? slot?.labelTl || docType : slot?.labelEn || docType;
                  const helper = language === 'taglish' ? slot?.helperTl : slot?.helperEn;

                  return (
                    <div
                      key={docType}
                      className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                        isUploaded
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div
                        className={
                          isUploaded
                            ? 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold bg-emerald-600 text-white'
                            : 'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold bg-slate-200 text-slate-600'
                        }
                      >
                        {isUploaded ? '✓' : '•'}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 leading-tight">
                            {title}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isUploaded
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {isUploaded
                              ? (language === 'taglish' ? 'Handa na' : 'Ready')
                              : (language === 'taglish' ? 'Kailangan' : 'Required')}
                          </span>
                        </div>
                        {helper && (
                          <p className="text-xs text-slate-500 leading-relaxed font-normal">
                            {helper}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Action Navigation Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                navigateToStep(2);
                setBannerError(null);
              }}
              className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring press-feedback w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'taglish' ? 'Baguhin ang Datos' : 'Edit Details'}</span>
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onNavigateToTab('print_forms')}
                className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring w-full sm:w-auto"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'taglish' ? 'I-print ang mga Form (PDF)' : 'Print Forms (PDF)'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTab('vault')}
                className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring w-full sm:w-auto"
              >
                <span>Document Vault (&lt;2MB)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            {medicalCase.category === 'burial_funeral' && <CrossPillarBridgeCard pillar="worker"
              title={language === 'taglish' ? 'Tulong sa Libing (SSS / GSIS / ECC Funeral Aid)' : 'Funeral assistance (SSS / GSIS / ECC)'}
              description={language === 'taglish' ? 'Suriin ang posibleng funeral claim ng miyembro o pensioner. Ang ECC benefit ay para lamang sa compensable na work-related death; ahensya ang magpapatunay ng claim.' : 'Review possible funeral claims for a member or pensioner. ECC funeral assistance requires a compensable work-related death; agencies confirm each claim.'}
              benefit={language === 'taglish' ? 'SSS: ₱20k-₱60k kung may 36+ hulog; hiwalay na EC: ₱30k kung compensable' : 'SSS: ₱20k-₱60k with 36+ contributions; separate EC: ₱30k if compensable'}
              href="/manggagawa?scenario=funeral&bridge=1" context={sharedFamilyContext} language={language} />}
            {isMedicalSicknessCase && <CrossPillarBridgeCard pillar="worker"
              title={language === 'taglish' ? 'SSS Sickness Benefit at ECC Medical Reimbursement' : 'SSS sickness benefit and EC medical reimbursement'}
              description={language === 'taglish' ? 'Kung hindi makapagtrabaho dahil sa pagkakasakit o injury, maaaring magtanong tungkol sa SSS sickness claim. Ang EC reimbursement ay para sa kwalipikadong work-related na kaso at aprubadong gastos.' : 'If illness or injury prevents work, ask about an SSS sickness claim. EC medical reimbursement applies to qualifying work-related cases and approved expenses.'}
              benefit={language === 'taglish' ? 'Hanggang 120 araw sa isang taon sa SSS; may qualifying rules' : 'Up to 120 days per calendar year under SSS rules'}
              href="/manggagawa?scenario=sickness&bridge=1" context={sharedFamilyContext} language={language} />}
            {patient.isOFWOrDependent && <CrossPillarBridgeCard pillar="worker"
              title={language === 'taglish' ? 'OWWA Welfare Assistance Program (WAP)' : 'OWWA Welfare Assistance Program (WAP)'}
              description={language === 'taglish' ? 'Magtanong sa OWWA Regional Welfare Office tungkol sa kasalukuyang tulong para sa kwalipikadong OFW member o dependent.' : 'Ask the OWWA Regional Welfare Office about current support for a qualified OFW member or dependent.'}
              benefit={language === 'taglish' ? 'Assessment, membership, at kasalukuyang patakaran ng OWWA ang susundin' : 'OWWA assessment, membership, and current rules apply'}
              href="/manggagawa?scenario=sickness&bridge=1" context={sharedFamilyContext} language={language} />}
            {showEducationBridge && <CrossPillarBridgeCard pillar="education"
              title={medicalCase.category === 'burial_funeral'
                ? (language === 'taglish' ? 'Tulong sa Pag-aaral para sa mga Anak ng Pamilyang Nagluluksa' : 'Education support for children in a bereaved family')
                : (language === 'taglish' ? 'Scholarship at Tuition Support para sa Pamilya' : 'Scholarships and tuition support for your family')}
              description={medicalCase.category === 'burial_funeral'
                ? (language === 'taglish' ? 'Kung aktibong OWWA member ang pumanaw, itanong ang ELAP para sa kwalipikadong dependent. Maaari ring magtanong sa DSWD tungkol sa educational assistance.' : 'If the deceased was an active OWWA member, ask about ELAP for qualified dependents. DSWD educational assistance may also be worth asking about.')
                : (language === 'taglish' ? 'Suriin ang CHED TES, TDP, at Free Higher Education. May eligibility, school, funding, at slot requirements.' : 'Review CHED TES, TDP, and Free Higher Education. Eligibility, school, funding, and slot rules apply.')}
              benefit={medicalCase.category === 'burial_funeral'
                ? (language === 'taglish' ? 'OWWA ELAP: hanggang ₱10k bawat school year para sa qualified college dependent' : 'OWWA ELAP: up to ₱10k per school year for a qualified college dependent')
                : (language === 'taglish' ? 'Posibleng tuition support o scholarship; ahensya at paaralan ang magkukumpirma' : 'Possible tuition support or scholarship; agencies and schools confirm eligibility')}
              href="/edukasyon?bridge=1" context={sharedFamilyContext} language={language} />}
          </div>
          <details className="rounded-2xl border border-[#E2DFD6] bg-white">
            <summary className="min-h-[44px] cursor-pointer p-4 font-semibold text-slate-900 focus-ring">{t.medicalToolsOptional}</summary>
            <div className="space-y-4 border-t border-[#E2DFD6] p-4">
              <GenericPrescriptionGuideCard language={language} />
              <GLCooldownTrackerCard medicalCase={medicalCase} applications={localApplications}
                onSaveApplications={handleSaveApplications} language={language} />
              <TreatmentQuotaTrackerCard medicalCase={medicalCase} language={language} />
            </div>
          </details>
        </div>

  );
}
