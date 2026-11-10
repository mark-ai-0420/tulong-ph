import { SpecialtyBenefitGuidanceCards } from './TriageStep3Roadmap';

import React, { useState, useEffect } from 'react';

import { ArrowRight, ArrowLeft, AlertCircle, Building, Building2, HeartPulse, ShieldCheck, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Landmark, Zap, Calculator, HelpCircle } from 'lucide-react';
import { PatientProfile, MedicalCase, EmergencyCategory, HospitalType, AdmissionStatus } from '@/types/assistance';

import { Language, translations } from '@/lib/i18n';

import { MALASAKIT_CENTERS_DIRECTORY, MalasakitCenterLocation } from '@/lib/data/malasakitCenters';

import { computeStatutoryDeductions, DetailedBillBreakdown } from '@/lib/billingCalculator';
import { matchPhilHealthCaseRate } from '@/lib/data/philhealthRates';

interface TriageStep2HospitalProps {
  calculatedAge: number | undefined;
  getPatientAge: () => number | undefined;
  setBannerError: React.Dispatch<React.SetStateAction<string | null>>;
  patient: PatientProfile;
  medicalCase: MedicalCase;
  language: Language;
  onUpdateMedicalCase: (medicalCase: MedicalCase) => void;
  stepMotionClass: string;
  bannerError: string | null;
  errors: Record<string, string>;
  isFieldInvalid: (field: string) => boolean;
  clearFieldError: (field: string) => void;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  navigateToStep: (step: number) => void;
  handleCalculateRoadmap: () => void;
  showRa11463Details: boolean;
  setShowRa11463Details: React.Dispatch<React.SetStateAction<boolean>>;
  autoCalculationState: DetailedBillBreakdown | null;
  setAutoCalculationState: React.Dispatch<React.SetStateAction<DetailedBillBreakdown | null>>;
}

export function TriageStep2Hospital({
  calculatedAge,
  getPatientAge,
  setBannerError,
  patient,
  medicalCase,
  language,
  onUpdateMedicalCase,
  stepMotionClass,
  bannerError,
  errors,
  isFieldInvalid,
  clearFieldError,
  setTouched,
  navigateToStep,
  handleCalculateRoadmap,
  showRa11463Details,
  setShowRa11463Details,
  autoCalculationState,
  setAutoCalculationState,
}: TriageStep2HospitalProps) {
  const t = translations[language];
  // Step 2 Hospital Autocomplete State & Ref
  const [isHospitalDropdownOpen, setIsHospitalDropdownOpen] = useState<boolean>(false);
  const hospitalDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        hospitalDropdownRef.current &&
        !hospitalDropdownRef.current.contains(event.target as Node)
      ) {
        setIsHospitalDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hospitalSuggestions = React.useMemo(() => {
    const query = (medicalCase.hospitalName || '').trim().toLowerCase();
    if (!query) return [];
    return MALASAKIT_CENTERS_DIRECTORY.filter((center) => {
      const nameMatch = center.hospitalName.toLowerCase().includes(query);
      const cityMatch = center.provinceOrCity.toLowerCase().includes(query);
      const addressMatch = center.address.toLowerCase().includes(query);
      const aliasMatch = center.aliases?.some((a) => a.toLowerCase().includes(query));
      return nameMatch || cityMatch || addressMatch || aliasMatch;
    }).slice(0, 6);
  }, [medicalCase.hospitalName]);

  const handleSelectHospitalCenter = (center: MalasakitCenterLocation) => {
    // If DOH Retained or Specialty Medical Center -> public_doh, if LGU -> public_lgu
    const newType: HospitalType = center.hospitalType.includes('LGU') ? 'public_lgu' : 'public_doh';

    onUpdateMedicalCase({
      ...medicalCase,
      hospitalName: center.hospitalName,
      hospitalType: newType,
      hospitalCity: center.provinceOrCity,
      hasMalasakitCenter: true,
    });
    clearFieldError('hospitalName');
    setIsHospitalDropdownOpen(false);
  };

  // Auto-calculate net bill
  const handleBillChange = (total: number, philhealth: number, seniorPwd: number) => {
    const net = Math.max(0, total - philhealth - seniorPwd);
    onUpdateMedicalCase({
      ...medicalCase,
      totalHospitalBill: total,
      philhealthDeduction: philhealth,
      seniorPwdDiscount: seniorPwd,
      netRemainingBalance: net,
    });
  };

  // 1-Click Auto-Compute (PhilHealth & Senior/PWD)
  const handleAutoCompute = () => {
    const breakdown = computeStatutoryDeductions({
      totalBill: medicalCase.totalHospitalBill,
      hospitalType: medicalCase.hospitalType,
      isSeniorCitizen: patient.isSeniorCitizen,
      isPWD: patient.isPWD,
      patientAge: getPatientAge(),
      diagnosis: medicalCase.diagnosis,
      category: medicalCase.category,
    });

    setAutoCalculationState(breakdown);
    onUpdateMedicalCase({
      ...medicalCase,
      philhealthDeduction: Math.round(breakdown.philhealthDeductionAmount),
      seniorPwdDiscount: Math.round(breakdown.totalSeniorPwdRelief),
      netRemainingBalance: Math.round(breakdown.netRemainingBalance),
      isAutoCalculated: true,
      philhealthMatchedCondition: breakdown.philhealthMatchedCondition,
      seniorPwdVatExempt: breakdown.vatAmountRemoved,
      seniorPwdDiscountAmount: breakdown.seniorPwdDiscountAmount,
    });
  };

  // Statutory Breakdown display variables
  const isSeniorPwdActive =
    medicalCase.seniorPwdDiscount > 0 ||
    (autoCalculationState ? autoCalculationState.totalSeniorPwdRelief > 0 : false);

  const isPhilHealthActive =
    medicalCase.philhealthDeduction > 0 ||
    (autoCalculationState ? autoCalculationState.philhealthDeductionAmount > 0 : false);

  const isNbbEligible =
    medicalCase.hospitalType === 'public_doh' &&
    (patient.isSeniorCitizen ||
      patient.isPWD ||
      (typeof calculatedAge === 'number' && calculatedAge >= 60) ||
      patient.socioeconomicClass === 'indigent' ||
      patient.is4PsBeneficiary ||
      Boolean(autoCalculationState?.isNoBalanceBillingEligible));

  const showBreakdownCard = Boolean(
    autoCalculationState ||
      medicalCase.isAutoCalculated ||
      isSeniorPwdActive ||
      isPhilHealthActive ||
      isNbbEligible
  );
  const calcVatExemptSales =
    medicalCase.totalHospitalBill > 0
      ? Math.round((medicalCase.totalHospitalBill / 1.12) * 100) / 100
      : 0;
  const fallbackVatRemoved =
    medicalCase.totalHospitalBill > 0
      ? Math.round((medicalCase.totalHospitalBill - calcVatExemptSales) * 100) / 100
      : 0;
  const fallbackDiscountAmount =
    medicalCase.totalHospitalBill > 0
      ? Math.round(calcVatExemptSales * 0.2 * 100) / 100
      : 0;

  const vatRemoved = Math.round(
    autoCalculationState?.vatAmountRemoved ??
      medicalCase.seniorPwdVatExempt ??
      fallbackVatRemoved
  );
  const discountAmount = Math.round(
    autoCalculationState?.seniorPwdDiscountAmount ??
      medicalCase.seniorPwdDiscountAmount ??
      fallbackDiscountAmount
  );

  const matchedCondition =
    medicalCase.philhealthMatchedCondition ||
    autoCalculationState?.philhealthMatchedCondition ||
    matchPhilHealthCaseRate(
      medicalCase.diagnosis,
      medicalCase.category,
      medicalCase.totalHospitalBill
    ).matchedName;

  return (
        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            handleCalculateRoadmap();
          }}
          className={`bg-white rounded-2xl border border-[#E2DFD6] p-6 sm:p-7 shadow-xs space-y-6 ${stepMotionClass}`}
        >
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{t.step2Title}</h2>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">{t.step2Subtitle}</p>
          </div>

          <div className="space-y-4">
            {/* Emergency Category */}
            <div>
              <label
                htmlFor="case-category"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
              >
                {t.emergencyType}
              </label>
              <select
                autoComplete="off"
                id="case-category"
                name="category"
                value={medicalCase.category}
                onChange={(e) =>
                  onUpdateMedicalCase({
                    ...medicalCase,
                    category: e.target.value as EmergencyCategory,
                  })
                }
                className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-base sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="hospitalization">Hospital Confinement / Inpatient Care</option>
                <option value="chemotherapy">Chemotherapy / Cancer Treatment</option>
                <option value="dialysis">Hemodialysis / Peritoneal Dialysis</option>
                <option value="surgery_implants">Surgery / Specialty Implants / Pacemaker</option>
                <option value="prescription_medicines">Specialty Prescription Medicines</option>
                <option value="laboratory_diagnostics">CT Scan / MRI / Laboratory Diagnostics</option>
                <option value="burial_funeral">Burial & Funeral Assistance</option>
                <option value="transportation_emergency">Emergency Transport / Balik Probinsya</option>
              </select>
            </div>

            {/* Admission Status 3-Pill Toggle */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                {language === 'taglish' ? 'Kasalukuyang Estado ng Admission / Confinement:' : 'Current Admission Status:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'confined_running_bill' as AdmissionStatus,
                    label: t.statusConfined,
                    description: t.statusConfinedHint,
                  },
                  {
                    id: 'discharge_final_soa' as AdmissionStatus,
                    label: t.statusDischarge,
                    description: t.statusDischargeHint,
                  },
                  {
                    id: 'outpatient' as AdmissionStatus,
                    label: t.statusOutpatient,
                    description: t.statusOutpatientHint,
                  },
                ].map((item) => {
                  const currentStatus = medicalCase.admissionStatus || 'confined_running_bill';
                  const isSelected = currentStatus === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() =>
                        onUpdateMedicalCase({
                          ...medicalCase,
                          admissionStatus: item.id,
                        })
                      }
                      className={`min-h-[44px] p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer focus-ring ${
                        isSelected
                          ? 'border-2 border-blue-900 bg-blue-50/80 shadow-xs ring-2 ring-blue-900/10'
                          : 'border border-[#E2DFD6] bg-white hover:bg-stone-50 text-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-slate-900 leading-tight">
                            {item.label}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-blue-900 bg-blue-900' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-normal">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Reassurance pill when Naka-confine pa is selected */}
              {(medicalCase.admissionStatus || 'confined_running_bill') === 'confined_running_bill' && (
                <div className="rounded-xl border border-[#E2DFD6] border-l-4 border-l-blue-900 bg-[#F3F2EC] p-3 text-xs font-semibold leading-relaxed text-slate-800 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
                  <span>
                    {language === 'taglish'
                      ? 'Huwag hintayin ang araw ng discharge. Maaari nang gamitin ang Running Bill para humingi ng Guarantee Letter sa PCSO, Senado, at PACe habang naka-confine pa.'
                      : 'Do not wait for discharge day. You can use your interim Running Bill to secure Guarantee Letters from PCSO, the Senate, and PACe while still admitted.'}
                  </span>
                </div>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <label
                htmlFor="case-diagnosis"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
              >
                {t.diagnosis} *
              </label>
              <input
                id="case-diagnosis"
                name="diagnosis"
                type="text"
                autoComplete="off"
                required
                aria-required="true"
                aria-invalid={isFieldInvalid('diagnosis')}
                value={medicalCase.diagnosis}
                onChange={(e) => {
                  onUpdateMedicalCase({ ...medicalCase, diagnosis: e.target.value });
                  clearFieldError('diagnosis');
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, diagnosis: true }))}
                placeholder="e.g. Acute Coronary Syndrome, Chronic Kidney Disease Stage 5, Pneumonia"
                className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-base sm:text-sm transition-colors focus:outline-hidden ${
                  isFieldInvalid('diagnosis')
                    ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/20 text-red-950 placeholder-red-300'
                    : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white'
                }`}
              />
              {isFieldInvalid('diagnosis') && (
                <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.diagnosis}</span>
                </p>
              )}

            </div>

            <SpecialtyBenefitGuidanceCards
              category={medicalCase.category}
              diagnosis={medicalCase.diagnosis}
              region={patient.address.region}
              province={patient.address.province}
              language={language}
            />

            {/* Hospital Classification Selection: 3 clean, high-contrast selection cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                {t.hospitalType} *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Public - DOH Retained / Specialty */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateMedicalCase({
                      ...medicalCase,
                      hospitalType: 'public_doh',
                      hasMalasakitCenter: true,
                      privateStrategy: undefined,
                    })
                  }
                  className={`min-h-[44px] p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer focus-ring ${
                    medicalCase.hospitalType === 'public_doh'
                      ? 'border-2 border-blue-900 bg-blue-50/70 shadow-xs ring-2 ring-blue-900/10'
                      : 'border border-[#E2DFD6] bg-white hover:bg-stone-50 text-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-blue-900 shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          Public - DOH Retained / Specialty
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          medicalCase.hospitalType === 'public_doh'
                            ? 'border-blue-900 bg-blue-900'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {medicalCase.hospitalType === 'public_doh' && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-xs font-bold">
                        Malasakit Desk Active
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-xs font-bold">
                        Zero-Billing Target
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                    <span className="text-blue-900">PGH, Heart, NKTI</span>
                    <span className="text-emerald-800 font-bold">DOH MAIP</span>
                  </div>
                </button>

                {/* Public - LGU Provincial / City / District */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateMedicalCase({
                      ...medicalCase,
                      hospitalType: 'public_lgu',
                      hasMalasakitCenter: true,
                      privateStrategy: undefined,
                    })
                  }
                  className={`min-h-[44px] p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer focus-ring ${
                    medicalCase.hospitalType === 'public_lgu'
                      ? 'border-2 border-blue-900 bg-blue-50/70 shadow-xs ring-2 ring-blue-900/10'
                      : 'border border-[#E2DFD6] bg-white hover:bg-stone-50 text-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-slate-700 shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          Public LGU Provincial
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          medicalCase.hospitalType === 'public_lgu'
                            ? 'border-blue-900 bg-blue-900'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {medicalCase.hospitalType === 'public_lgu' && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-xs font-bold">
                        Malasakit Desk Active
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-bold">
                        LGU Medical Fund
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">Provincial / City Hosp</span>
                    <span className="text-slate-800 font-bold">LGU Subsidized</span>
                  </div>
                </button>

                {/* Private Hospital / Medical Center */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateMedicalCase({
                      ...medicalCase,
                      hospitalType: 'private',
                      hasMalasakitCenter: false,
                      privateStrategy: medicalCase.privateStrategy || 'gl_stacking',
                    })
                  }
                  className={`min-h-[44px] p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer focus-ring ${
                    medicalCase.hospitalType === 'private'
                      ? 'border-2 border-blue-900 bg-blue-50/70 shadow-xs ring-2 ring-blue-900/10'
                      : 'border border-[#E2DFD6] bg-white hover:bg-stone-50 text-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-amber-800 shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          Private Hospital / Medical Center
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          medicalCase.hospitalType === 'private'
                            ? 'border-blue-900 bg-blue-900'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {medicalCase.hospitalType === 'private' && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold">
                        Credit & Collection GL Stacking
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 text-xs font-bold">
                        No Malasakit Desk
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                    <span className="text-amber-800">St. Luke&apos;s, TMC, Clinics</span>
                    <span className="text-amber-900 font-bold">GL Stacking</span>
                  </div>
                </button>
              </div>

              {/* Expandable legal background toggle (RA 11463) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowRa11463Details((prev) => !prev)}
                  className="text-xs font-semibold text-blue-900 hover:text-blue-700 inline-flex items-center gap-1.5 py-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>
                    Bakit magkaiba ang proseso sa Pribado at Publiko? [{showRa11463Details ? 'Isara' : 'Buksan'}]
                  </span>
                  {showRa11463Details ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showRa11463Details && (
                  <div className="mt-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 animate-in fade-in duration-150">
                    <p className="font-bold text-slate-900">
                      Batas Republika Blg. 11463 (Malasakit Centers Act):
                    </p>
                    <p className="leading-relaxed font-normal">
                      Ayon sa RA 11463, ang mga Malasakit Center desks ay itinatag lamang sa mga pampublikong ospital ng DOH at LGU. Sa mga pribadong ospital, hindi mandatory ang No-Balance-Billing at hiwalay ang Professional Fees ng mga doktor. Gayunpaman, mandatory pa rin sa batas ang PhilHealth deductions at 20% Senior/PWD discounts + 12% VAT exemption, at tinatanggap ang mga Guarantee Letter mula sa PCSO, Senado, at PACe sa Credit & Collection section.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* When Private is selected: Render Strategy Selector */}
            {medicalCase.hospitalType === 'private' && (
              <div className="space-y-4 animate-in fade-in duration-200">

                {/* Strategy Selector (2 Interactive Radio Cards) */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    {language === 'taglish'
                      ? 'Piliin ang Inyong Estratehiya sa Pribadong Ospital:'
                      : 'Select Your Private Hospital Strategy:'} *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Option A: GL Stacking */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={(medicalCase.privateStrategy || 'gl_stacking') === 'gl_stacking'}
                      onClick={() =>
                        onUpdateMedicalCase({
                          ...medicalCase,
                          privateStrategy: 'gl_stacking',
                        })
                      }
                      className={`min-h-[44px] p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer focus-ring ${
                        (medicalCase.privateStrategy || 'gl_stacking') === 'gl_stacking'
                          ? 'border-2 border-blue-900 bg-blue-50/70 shadow-xs ring-2 ring-blue-900/10'
                          : 'border border-[#E2DFD6] bg-white hover:bg-stone-50 text-slate-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💳</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              {language === 'taglish'
                                ? 'Option A: GL Stacking sa Pribadong Ospital'
                                : 'Option A: Private Hospital GL Stacking'}
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              (medicalCase.privateStrategy || 'gl_stacking') === 'gl_stacking'
                                ? 'border-blue-900 bg-blue-900'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {(medicalCase.privateStrategy || 'gl_stacking') === 'gl_stacking' && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {language === 'taglish'
                            ? 'Mananatili sa pribado; gamitin ang PhilHealth, Senior/PWD 20% (batas), PCSO, PACe, at Senate GL sa Billing/Credit & Collection.'
                            : 'Remain in private hospital; utilize PhilHealth, Senior/PWD 20% (by law), PCSO, PACe, and Senate GL at Billing/Credit & Collection.'}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                        <span className="text-blue-900">Credit & Collection Stacking</span>
                        <span className="text-emerald-800 font-bold">35%–70% Bawas</span>
                      </div>
                    </button>

                    {/* Option B: Transfer Referral */}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={medicalCase.privateStrategy === 'transfer_referral'}
                      onClick={() =>
                        onUpdateMedicalCase({
                          ...medicalCase,
                          privateStrategy: 'transfer_referral',
                        })
                      }
                      className={`min-h-[44px] p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer focus-ring ${
                        medicalCase.privateStrategy === 'transfer_referral'
                          ? 'border-2 border-blue-900 bg-blue-50/70 shadow-xs ring-2 ring-blue-900/10'
                          : 'border border-[#E2DFD6] bg-white hover:bg-stone-50 text-slate-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🔄</span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              {language === 'taglish'
                                ? 'Option B: Paglipat sa Pampublikong Specialty Hospital'
                                : 'Option B: Transfer to Public Specialty Hospital'}
                            </span>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              medicalCase.privateStrategy === 'transfer_referral'
                                ? 'border-blue-900 bg-blue-900'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {medicalCase.privateStrategy === 'transfer_referral' && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {language === 'taglish'
                            ? 'Iwas-baon sa utang; mabilis lumobo ang ICU bill (₱50k-₱150k/araw); kailangan ng emergency-to-public referral sa PGH/Heart Center/NKTI/Lung Center.'
                            : 'Avoid catastrophic debt; ICU bills escalate rapidly (₱50k-₱150k/day); requires emergency-to-public referral to PGH/Heart Center/NKTI/Lung Center.'}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                        <span className="text-blue-900">Zero-Bankruptcy Protocol</span>
                        <span className="text-emerald-800 font-bold">100% Malasakit Target</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Hospital Name & Autocomplete Input */}
            <div className="relative" ref={hospitalDropdownRef}>
              <label
                htmlFor="hospital-name"
                className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
              >
                {t.hospitalName} *
              </label>
              <div className="relative">
                <input
                  id="hospital-name"
                  name="hospitalName"
                  type="text"
                  role="combobox"
                  autoComplete="off"
                  required
                  aria-required="true"
                  aria-autocomplete="list"
                  aria-controls="hospital-suggestions-list"
                  aria-expanded={isHospitalDropdownOpen && hospitalSuggestions.length > 0}
                  aria-invalid={isFieldInvalid('hospitalName')}
                  value={medicalCase.hospitalName}
                  onChange={(e) => {
                    onUpdateMedicalCase({ ...medicalCase, hospitalName: e.target.value });
                    clearFieldError('hospitalName');
                    setIsHospitalDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (medicalCase.hospitalName && medicalCase.hospitalName.trim().length > 0) {
                      setIsHospitalDropdownOpen(true);
                    }
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, hospitalName: true }))}
                  placeholder={
                    medicalCase.hospitalType === 'private'
                      ? (language === 'taglish' ? 'Hal. St. Luke\'s Medical Center, The Medical City, Cardinal Santos' : 'e.g. St. Luke\'s Medical Center, The Medical City, Cardinal Santos')
                      : (language === 'taglish' ? 'Hal. Philippine General Hospital, Heart Center, NKTI, EAMC' : 'e.g. Philippine General Hospital, Heart Center, NKTI, EAMC')
                  }
                  className={`w-full h-11 min-h-11 py-2.5 px-3.5 pr-10 rounded-lg border text-base sm:text-sm transition-colors focus:outline-hidden ${
                    isFieldInvalid('hospitalName')
                      ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/20 text-red-950 placeholder-red-300'
                      : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Building className="w-4 h-4" />
                </div>
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {isHospitalDropdownOpen && hospitalSuggestions.length > 0 && (
                <div
                  id="hospital-suggestions-list"
                  role="listbox"
                  aria-label="Malasakit Centers Directory"
                  className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150"
                >
                  <div className="px-3.5 py-1.5 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>160+ Malasakit Centers Directory</span>
                    <span className="text-blue-900 font-semibold">{hospitalSuggestions.length} found</span>
                  </div>
                  {hospitalSuggestions.map((center) => (
                    <button
                      key={center.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectHospitalCenter(center);
                      }}
                      className="w-full text-left p-3 hover:bg-blue-50/80 transition-colors flex items-start justify-between gap-3 group cursor-pointer"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                          <span className="truncate">{center.hospitalName}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate pl-5">
                          {center.address} • {center.provinceOrCity}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
                          Malasakit Desk
                        </span>
                        <span className="text-xs text-slate-600">
                          {center.hospitalType.includes('LGU') ? 'Public LGU' : 'Public DOH'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isFieldInvalid('hospitalName') && (
                <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.hospitalName}</span>
                </p>
              )}

              {/* Active Malasakit Facility Indicator (Public Only) */}
              {medicalCase.hospitalType !== 'private' && medicalCase.hasMalasakitCenter && medicalCase.hospitalName && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>
                    {language === 'taglish'
                      ? `Aktibo ang Malasakit Center sa pasilidad na ito${medicalCase.hospitalCity ? ` (${medicalCase.hospitalCity})` : ''}.`
                      : `Active Malasakit Center at this facility${medicalCase.hospitalCity ? ` (${medicalCase.hospitalCity})` : ''}.`}
                  </span>
                </div>
              )}
            </div>

            {/* Financials & Deduction Calculator */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {language === 'taglish' ? 'Kalkulador ng Balanse ng Bill' : 'Hospital Bill Breakdown (₱)'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-normal">
                    {language === 'taglish'
                      ? 'Opisyal na bawas batay sa PhilHealth ACR at RA 9994 / RA 10754'
                      : 'Statutory deductions per PhilHealth ACR and RA 9994 / RA 10754'}
                  </p>
                </div>
                <button
                  id="btn-auto-compute"
                  type="button"
                  onClick={handleAutoCompute}
                  className="min-h-[44px] h-11 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs transition-colors shrink-0"
                >
                  <Zap className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Auto-Kalkulahin (PhilHealth & Senior/PWD)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="total-bill"
                    className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                  >
                    {t.totalBill} *
                  </label>
                  <input
                    id="total-bill"
                    name="totalHospitalBill"
                    type="number"
                    autoComplete="off"
                    inputMode="numeric"
                    min="0"
                    aria-invalid={isFieldInvalid('totalHospitalBill')}
                    value={medicalCase.totalHospitalBill || ''}
                    onChange={(e) => {
                      const totalVal = Number(e.target.value) || 0;
                      handleBillChange(
                        totalVal,
                        medicalCase.philhealthDeduction,
                        medicalCase.seniorPwdDiscount
                      );
                      if (totalVal > 0) {
                        clearFieldError('totalHospitalBill');
                      }
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, totalHospitalBill: true }))}
                    placeholder="₱ 80,000"
                    className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-base sm:text-sm font-bold transition-colors focus:outline-hidden ${
                      isFieldInvalid('totalHospitalBill')
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/20 text-red-950 placeholder-red-300'
                        : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white'
                    }`}
                  />
                  {isFieldInvalid('totalHospitalBill') && (
                    <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.totalHospitalBill}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="philhealth-deduction"
                    className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                  >
                    {t.philhealthDeduction}
                  </label>
                  <input
                    id="philhealth-deduction"
                    name="philhealthDeduction"
                    type="number"
                    autoComplete="off"
                    inputMode="numeric"
                    min="0"
                    value={medicalCase.philhealthDeduction || ''}
                    onChange={(e) =>
                      handleBillChange(
                        medicalCase.totalHospitalBill,
                        Number(e.target.value) || 0,
                        medicalCase.seniorPwdDiscount
                      )
                    }
                    placeholder="₱ 18,000"
                    className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-base sm:text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="senior-pwd-discount"
                    className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                  >
                    {t.seniorPwdDeduction}
                  </label>
                  <input
                    id="senior-pwd-discount"
                    name="seniorPwdDiscount"
                    type="number"
                    autoComplete="off"
                    inputMode="numeric"
                    min="0"
                    value={medicalCase.seniorPwdDiscount || ''}
                    onChange={(e) =>
                      handleBillChange(
                        medicalCase.totalHospitalBill,
                        medicalCase.philhealthDeduction,
                        Number(e.target.value) || 0
                      )
                    }
                    placeholder="₱ 0"
                    className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-base sm:text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              {/* Net Result Bar */}
              <div id="net-remaining-balance" aria-live="polite" aria-atomic="true" className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white mt-2 shadow-xs">
                <span className="text-sm font-bold text-slate-200">{t.netRemaining}:</span>
                <span id="net-remaining-amount" className="tabular-nums text-xl font-bold text-amber-300">
                  ₱ {Math.round(medicalCase.netRemainingBalance).toLocaleString()}
                </span>
              </div>

              {/* Transparent Statutory Breakdown Card */}
              {showBreakdownCard && (
                <div className="p-4 sm:p-5 rounded-xl bg-stone-50 border border-[#E2DFD6] space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-blue-900" />
                      <span>
                        {language === 'taglish'
                          ? 'Opisyal na Buod ng Statutory Relief at Deductions'
                          : 'Official Statutory Relief & Deduction Summary'}
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-xs font-bold">
                      RA 9994 / RA 10754 / PhilHealth ACR
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* If Senior/PWD applied */}
                    {isSeniorPwdActive && (
                      <div className="p-3 rounded-lg bg-white border border-[#E2DFD6] space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>RA 9994 / RA 10754 Mandated Relief:</span>
                          </span>
                          <span className="tabular-nums text-emerald-700 font-bold shrink-0">
                            -₱{medicalCase.seniorPwdDiscount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal pl-5">
                          {medicalCase.hospitalType === 'private'
                            ? `12% VAT Exemption (₱${vatRemoved.toLocaleString()}) + 20% Senior/PWD Discount (₱${discountAmount.toLocaleString()})`
                            : '20% Statutory Discount sa Hospital Bill'}
                        </p>
                      </div>
                    )}

                    {/* If PhilHealth applied */}
                    {isPhilHealthActive && (
                      <div className="p-3 rounded-lg bg-white border border-[#E2DFD6] flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900">
                        <span className="truncate pr-2 flex items-center gap-1.5">
                          <HeartPulse className="w-4 h-4 text-blue-900 shrink-0" />
                          <span>PhilHealth Case Rate ({matchedCondition}):</span>
                        </span>
                        <span className="tabular-nums text-emerald-700 font-bold shrink-0">
                          -₱{medicalCase.philhealthDeduction.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* If in DOH hospital (public_doh) and patient is Senior/PWD or indigent */}
                    {isNbbEligible && (
                      <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs font-semibold leading-relaxed flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{t.nbbExplanation}</span>
                      </div>
                    )}
                  </div>

                  {/* Reassurance note */}
                  <p className="text-xs text-slate-500 font-normal pt-1 border-t border-slate-200">
                    Maaari ring baguhin nang manu-mano ang mga numero sa itaas kung may hawak nang opisyal na hospital Statement of Account (SOA).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Empathetic Error Banner if Validation Fails */}
          {bannerError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm font-semibold flex items-center gap-3 animate-in fade-in"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="flex-1">{bannerError}</span>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                navigateToStep(1);
                setBannerError(null);
              }}
              className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring press-feedback"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'taglish' ? 'Bumalik' : 'Back'}</span>
            </button>
            <button
              type="submit"
              className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring press-feedback"
            >
              <span>
                {language === 'taglish'
                  ? 'Tingnan ang Roadmap at Gabay sa Reseta'
                  : language === 'cebuano'
                    ? 'Tan-awa ang Roadmap ug Giya sa Reseta'
                    : language === 'ilocano'
                      ? 'Kitaen ti Roadmap ken Giya iti Reseta'
                      : 'View aid roadmap and prescription guide'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

  );
}
