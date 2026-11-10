import React from 'react';
import { LocationHierarchyFields } from '@/components/shared/LocationHierarchyFields';
import { ArrowRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { PatientProfile, RepresentativeProfile } from '@/types/assistance';

import { Language, translations } from '@/lib/i18n';

interface TriageStep1PatientProps {
  calculatedAge: number | undefined;
  patient: PatientProfile;
  representative: RepresentativeProfile;
  language: Language;
  onUpdatePatient: (patient: PatientProfile) => void;
  onUpdateRepresentative: (representative: RepresentativeProfile) => void;
  stepMotionClass: string;
  bannerError: string | null;
  errors: Record<string, string>;
  isFieldInvalid: (field: string) => boolean;
  clearFieldError: (field: string) => void;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  relationSelectValue: string;
  customRelation: string;
  handleRelationChange: (value: string) => void;
  handleCustomRelationChange: (value: string) => void;
  handleNextToStep2: () => void;
}

export const RELATIONSHIP_OPTIONS = [
  'Asawa / Spouse',
  'Anak / Child',
  'Magulang / Parent',
  'Kapatid / Sibling',
  'Pamangkin / Niece or Nephew',
  'Apo / Grandchild',
  'Lolo o Lola / Grandparent',
  'Bayaw o Hipag o Bilas / In-law',
  'Tiyuhin o Tiyahin / Uncle or Aunt',
  'Pinsan / Cousin',
  'Kinatawan / Legal Guardian or Caregiver',
  'Iba pa / Other',
] as const;

export function TriageStep1Patient({
  calculatedAge,
  patient,
  representative,
  language,
  onUpdatePatient,
  onUpdateRepresentative,
  stepMotionClass,
  bannerError,
  errors,
  isFieldInvalid,
  clearFieldError,
  setTouched,
  relationSelectValue,
  customRelation,
  handleRelationChange,
  handleCustomRelationChange,
  handleNextToStep2,
}: TriageStep1PatientProps) {
  const t = translations[language];

  return (
        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            handleNextToStep2();
          }}
          className={`bg-white rounded-2xl border border-[#E2DFD6] p-6 sm:p-7 shadow-xs space-y-6 ${stepMotionClass}`}
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{t.step1Title}</h2>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{t.step1Subtitle}</p>
            </div>
          </div>

          {/* Filing Mode Toggle */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">
              {t.whoIsApplying}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onUpdateRepresentative({
                    ...representative,
                    isPatientHimself: true,
                    relationshipToPatient: 'Self',
                  });
                  clearFieldError('representativeFullName');
                }}
                className={`min-h-11 flex items-center gap-3 p-3.5 rounded-xl border text-sm font-bold text-left transition-all cursor-pointer ${
                  representative.isPatientHimself
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    representative.isPatientHimself ? 'border-blue-600' : 'border-slate-400'
                  }`}
                >
                  {representative.isPatientHimself && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  )}
                </div>
                <span>{t.self}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateRepresentative({
                    ...representative,
                    isPatientHimself: false,
                    relationshipToPatient: 'Anak / Child',
                  })
                }
                className={`min-h-11 flex items-center gap-3 p-3.5 rounded-xl border text-sm font-bold text-left transition-all cursor-pointer ${
                  !representative.isPatientHimself
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    !representative.isPatientHimself ? 'border-blue-600' : 'border-slate-400'
                  }`}
                >
                  {!representative.isPatientHimself && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  )}
                </div>
                <span>{t.representative}</span>
              </button>
            </div>
          </div>

          {/* Representative Fields if applicable */}
          {!representative.isPatientHimself && (
            <div className="p-5 rounded-xl border border-[#E2DFD6] border-l-4 border-l-blue-900 bg-[#F3F2EC] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {language === 'taglish' ? 'Detalye ng Kinatawan / Kamag-anak' : "Representative's Details"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="rep-full-name"
                    className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                  >
                    {language === 'taglish' ? 'Pangalan ng Kinatawan' : "Representative's Full Name"} *
                  </label>
                  <input
                    id="rep-full-name"
                    name="representativeFullName"
                    type="text"
                    autoComplete="off"
                    required={!representative.isPatientHimself}
                    aria-required={!representative.isPatientHimself ? 'true' : undefined}
                    aria-invalid={isFieldInvalid('representativeFullName')}
                    value={representative.fullName}
                    onChange={(e) => {
                      onUpdateRepresentative({ ...representative, fullName: e.target.value });
                      clearFieldError('representativeFullName');
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, representativeFullName: true }))}
                    placeholder="e.g. Maria Santos Dela Cruz"
                    className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-base sm:text-sm transition-colors focus:outline-hidden ${
                      isFieldInvalid('representativeFullName')
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/20 text-red-950 placeholder-red-300'
                        : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white'
                    }`}
                  />
                  {isFieldInvalid('representativeFullName') && (
                    <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.representativeFullName}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="rep-relationship"
                    className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                  >
                    {t.relationship} *
                  </label>
                  <select
                    autoComplete="off"
                    id="rep-relationship"
                    name="representativeRelationship"
                    required={!representative.isPatientHimself}
                    aria-required={!representative.isPatientHimself ? 'true' : undefined}
                    aria-invalid={isFieldInvalid('representativeRelationship')}
                    value={relationSelectValue}
                    onChange={(e) => handleRelationChange(e.target.value)}
                    className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-base sm:text-sm font-semibold transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white ${
                      isFieldInvalid('representativeRelationship')
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/20 text-red-950'
                        : 'border-slate-300 text-slate-900'
                    }`}
                  >
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  {relationSelectValue === 'Iba pa / Other' && (
                    <div className="pt-1 animate-in fade-in duration-150">
                      <label
                        htmlFor="rep-relationship-other"
                        className="text-xs font-semibold text-slate-600 block mb-1"
                      >
                        {language === 'taglish' ? 'Pakitukoy ang relasyon:' : 'Specify relation:'} *
                      </label>
                      <input
                        id="rep-relationship-other"
                        name="representativeCustomRelationship"
                        type="text"
                        autoComplete="off"
                        required
                        aria-required="true"
                        aria-invalid={isFieldInvalid('representativeRelationship')}
                        value={customRelation}
                        onChange={(e) => handleCustomRelationChange(e.target.value)}
                        onBlur={() => setTouched((prev) => ({ ...prev, representativeRelationship: true }))}
                        placeholder={
                          language === 'taglish'
                            ? 'Hal. Kinakapatid, Kapitbahay, Legal Guardian'
                            : 'e.g. Legal Guardian, Neighbor, Foster Parent'
                        }
                        className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-base sm:text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white ${
                          isFieldInvalid('representativeRelationship')
                            ? 'border-red-500 bg-red-50/20 text-red-950 placeholder-red-300'
                            : 'border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  )}

                  {isFieldInvalid('representativeRelationship') && (
                    <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.representativeRelationship}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Patient Details Form */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {language === 'taglish' ? 'Detalye ng Pasyente' : "Patient's Demographics"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="patient-first-name"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                >
                  {t.firstName} *
                </label>
                <input
                  id="patient-first-name"
                  name="firstName"
                  type="text"
                  autoComplete="off"
                  required
                  aria-required="true"
                  aria-invalid={isFieldInvalid('firstName')}
                  value={patient.firstName}
                  onChange={(e) => {
                    onUpdatePatient({ ...patient, firstName: e.target.value });
                    clearFieldError('firstName');
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, firstName: true }))}
                  placeholder="e.g. Juan"
                  className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-base sm:text-sm transition-colors focus:outline-hidden ${
                    isFieldInvalid('firstName')
                      ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/20 text-red-950 placeholder-red-300'
                      : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white'
                  }`}
                />
                {isFieldInvalid('firstName') && (
                  <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.firstName}</span>
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="patient-middle-name"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                >
                  {t.middleName}
                </label>
                <input
                  id="patient-middle-name"
                  name="middleName"
                  type="text"
                  autoComplete="off"
                  value={patient.middleName}
                  onChange={(e) => onUpdatePatient({ ...patient, middleName: e.target.value })}
                  placeholder="e.g. Ramos"
                  className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                />
              </div>
              <div>
                <label
                  htmlFor="patient-last-name"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                >
                  {t.lastName} *
                </label>
                <input
                  id="patient-last-name"
                  name="lastName"
                  type="text"
                  autoComplete="off"
                  required
                  aria-required="true"
                  aria-invalid={isFieldInvalid('lastName')}
                  value={patient.lastName}
                  onChange={(e) => {
                    onUpdatePatient({ ...patient, lastName: e.target.value });
                    clearFieldError('lastName');
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, lastName: true }))}
                  placeholder="e.g. Santos"
                  className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-base sm:text-sm transition-colors focus:outline-hidden ${
                    isFieldInvalid('lastName')
                      ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/20 text-red-950 placeholder-red-300'
                      : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white'
                  }`}
                />
                {isFieldInvalid('lastName') && (
                  <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.lastName}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="patient-dob"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                >
                  {t.dateOfBirth}
                </label>
                <input
                  id="patient-dob"
                  name="dateOfBirth"
                  type="date"
                  autoComplete="off"
                  value={patient.dateOfBirth}
                  onChange={(e) => onUpdatePatient({ ...patient, dateOfBirth: e.target.value })}
                  className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                />
                {typeof calculatedAge === 'number' && calculatedAge >= 0 && (
                  <p className="text-xs mt-1 font-semibold text-slate-600 flex items-center gap-1">
                    <span>
                      {language === 'taglish' ? `Edad: ${calculatedAge} taon` : `Age: ${calculatedAge} yrs old`}
                    </span>
                    {calculatedAge >= 60 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-xs font-bold">
                        Senior (RA 9994)
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="patient-contact"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                >
                  {t.contactNumber} *
                </label>
                <input
                  id="patient-contact"
                  name="contactNumber"
                  type="tel"
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={11}
                  required
                  aria-required="true"
                  aria-invalid={isFieldInvalid('contactNumber')}
                  value={patient.contactNumber}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 11);
                    onUpdatePatient({ ...patient, contactNumber: onlyNums });
                    clearFieldError('contactNumber');
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, contactNumber: true }))}
                  placeholder="09171234567"
                  className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-base sm:text-sm font-mono tracking-wide transition-colors focus:outline-hidden ${
                    isFieldInvalid('contactNumber')
                      ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/20 text-red-950 placeholder-red-300'
                      : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white'
                  }`}
                />
                <div className="flex items-center justify-between gap-1 mt-1">
                  {isFieldInvalid('contactNumber') ? (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.contactNumber}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {language === 'taglish' ? 'Dapat magsimula sa 09' : 'Must start with 09'}
                    </p>
                  )}
                  <span className={`text-xs font-mono shrink-0 ${patient.contactNumber?.length === 11 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                    {(patient.contactNumber || '').length}/11
                  </span>
                </div>
              </div>
              <div>
                <label
                  htmlFor="patient-philhealth"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                >
                  {t.philhealthNo}
                </label>
                <input
                  id="patient-philhealth"
                  name="philhealthNumber"
                  type="text"
                  autoComplete="off"
                  inputMode="numeric"
                  maxLength={12}
                  aria-invalid={isFieldInvalid('philhealthNumber')}
                  value={patient.philhealthNumber || ''}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 12);
                    onUpdatePatient({ ...patient, philhealthNumber: onlyNums });
                    clearFieldError('philhealthNumber');
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, philhealthNumber: true }))}
                  placeholder="123456789012"
                  className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-base sm:text-sm font-mono tracking-wide transition-colors focus:outline-hidden ${
                    isFieldInvalid('philhealthNumber')
                      ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/20 text-red-950 placeholder-red-300'
                      : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white'
                  }`}
                />
                <div className="flex items-center justify-between gap-1 mt-1">
                  {isFieldInvalid('philhealthNumber') ? (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.philhealthNumber}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {language === 'taglish' ? '12 digits (opsyonal kung wala pa)' : '12 digits (optional)'}
                    </p>
                  )}
                  {(patient.philhealthNumber || '').length > 0 && (
                    <span className={`text-xs font-mono shrink-0 ${patient.philhealthNumber?.length === 12 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      {(patient.philhealthNumber || '').length}/12
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Broadest-to-narrowest address, with direct editable inputs. */}
            <LocationHierarchyFields idPrefix="patient" value={patient.address} language={language} onChange={({ province, cityMunicipality, barangay }) => {
              onUpdatePatient({ ...patient, address: { ...patient.address, province, cityMunicipality, barangay } });
              clearFieldError('cityMunicipality');
            }} />

            {/* Special Socioeconomic Qualifications */}
            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">
                {language === 'taglish'
                  ? 'Mga Espesyal na Kwalipikasyon (Mag-check ng angkop):'
                  : 'Special Categories & Eligibility Boosters:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <label
                  htmlFor="patient-is-senior"
                  className={`min-h-[52px] flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    patient.isSeniorCitizen
                      ? 'bg-blue-50/80 border-blue-900 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    autoComplete="off"
                    id="patient-is-senior"
                    name="isSeniorCitizen"
                    type="checkbox"
                    checked={patient.isSeniorCitizen}
                    onChange={(e) =>
                      onUpdatePatient({ ...patient, isSeniorCitizen: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-blue-900 focus:ring-blue-500 shrink-0"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                      {t.isSenior}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {language === 'taglish' ? '20% diskwento + 12% VAT exemption' : '20% discount + VAT exempt'}
                    </span>
                  </div>
                </label>

                <label
                  htmlFor="patient-is-pwd"
                  className={`min-h-[52px] flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    patient.isPWD
                      ? 'bg-blue-50/80 border-blue-900 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    autoComplete="off"
                    id="patient-is-pwd"
                    name="isPWD"
                    type="checkbox"
                    checked={patient.isPWD}
                    onChange={(e) => onUpdatePatient({ ...patient, isPWD: e.target.checked })}
                    className="w-5 h-5 rounded text-blue-900 focus:ring-blue-500 shrink-0"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                      {t.isPWD}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {language === 'taglish' ? 'May ID mula sa PDAO / LGU' : 'With valid PDAO ID'}
                    </span>
                  </div>
                </label>

                <label
                  htmlFor="patient-is-4ps"
                  className={`min-h-[52px] flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    patient.is4PsBeneficiary
                      ? 'bg-blue-50/80 border-blue-900 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    autoComplete="off"
                    id="patient-is-4ps"
                    name="is4PsBeneficiary"
                    type="checkbox"
                    checked={patient.is4PsBeneficiary}
                    onChange={(e) =>
                      onUpdatePatient({ ...patient, is4PsBeneficiary: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-blue-900 focus:ring-blue-500 shrink-0"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                      {t.is4Ps}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {language === 'taglish' ? 'Kasapi sa Pantawid Pamilya' : 'Pantawid Pamilya member'}
                    </span>
                  </div>
                </label>

                <label
                  htmlFor="patient-is-ofw"
                  className={`min-h-[52px] flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    patient.isOFWOrDependent
                      ? 'bg-blue-50/80 border-blue-900 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    autoComplete="off"
                    id="patient-is-ofw"
                    name="isOFWOrDependent"
                    type="checkbox"
                    checked={patient.isOFWOrDependent}
                    onChange={(e) =>
                      onUpdatePatient({ ...patient, isOFWOrDependent: e.target.checked })
                    }
                    className="w-5 h-5 rounded text-blue-900 focus:ring-blue-500 shrink-0"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                      {t.isOFW}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {language === 'taglish' ? 'May DMW/OWWA medical aid' : 'Eligible for DMW/OWWA aid'}
                    </span>
                  </div>
                </label>

                <label
                  htmlFor="patient-is-solo-parent"
                  className={`min-h-[52px] flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    patient.isSoloParent
                      ? 'bg-blue-50/80 border-blue-900 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input autoComplete="off" id="patient-is-solo-parent" name="isSoloParent" type="checkbox"
                    checked={Boolean(patient.isSoloParent)}
                    onChange={(e) => onUpdatePatient({ ...patient, isSoloParent: e.target.checked })}
                    className="w-5 h-5 rounded text-blue-900 focus:ring-blue-500 shrink-0" />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                      {language === 'taglish' ? 'Solo parent ang pasyente' : 'Patient is a solo parent'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {language === 'taglish' ? 'Maaaring may dagdag na education aid' : 'May help identify education aid'}
                    </span>
                  </div>
                </label>
              </div>
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

          {/* Navigation Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring press-feedback"
            >
              <span>{language === 'taglish' ? 'Susunod: Detalye ng Ospital' : 'Next: Hospital & Case'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

  );
}
