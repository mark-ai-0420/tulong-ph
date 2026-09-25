'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Building,
  HeartPulse,
  User,
  Clock,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Printer,
  Copy,
  Check,
  ExternalLink,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Phone,
  MapPin,
  Share2,
} from 'lucide-react';
import {
  PatientProfile,
  RepresentativeProfile,
  MedicalCase,
  EmergencyCategory,
  HospitalType,
  SocioeconomicClass,
  StoredDocument,
  ApplicationRecord,
} from '@/types/assistance';
import { calculateAidStacking, TriageResult } from '@/lib/triageEngine';
import { Language, translations } from '@/lib/i18n';
import { PCSOAssistant } from './PCSOAssistant';
import { SenateAssistant } from './SenateAssistant';
import { saveApplications, loadApplications } from '@/lib/storage';
import { MALASAKIT_CENTERS_DIRECTORY, MalasakitCenterLocation } from '@/lib/data/malasakitCenters';
import { parseDialableNumber } from '@/lib/phoneUtils';
import { DOCUMENT_SLOTS } from './DocumentVault';

const RELATIONSHIP_OPTIONS = [
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

interface TriageWizardProps {
  patient: PatientProfile;
  representative: RepresentativeProfile;
  medicalCase: MedicalCase;
  documents?: StoredDocument[];
  applications?: ApplicationRecord[];
  onSaveApplications?: (apps: ApplicationRecord[]) => void;
  onUpdatePatient: (p: PatientProfile) => void;
  onUpdateRepresentative: (r: RepresentativeProfile) => void;
  onUpdateMedicalCase: (c: MedicalCase) => void;
  onNavigateToTab: (tab: string) => void;
  language: Language;
}

export const TriageWizard: React.FC<TriageWizardProps> = ({
  patient,
  representative,
  medicalCase,
  documents = [],
  applications = [],
  onSaveApplications,
  onUpdatePatient,
  onUpdateRepresentative,
  onUpdateMedicalCase,
  onNavigateToTab,
  language,
}) => {
  const t = translations[language];
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Modal State for Embedded Full Assistants (PCSO / Senate)
  const [activeModal, setActiveModal] = useState<'pcso' | 'senate' | null>(null);
  const [localApplications, setLocalApplications] = useState<ApplicationRecord[]>(applications || []);

  // Synchronize external applications prop
  useEffect(() => {
    if (applications && applications.length > 0) {
      setLocalApplications(applications);
    }
  }, [applications]);

  // Load applications from IndexedDB if not passed in props
  useEffect(() => {
    if (!applications || applications.length === 0) {
      loadApplications().then((saved) => {
        if (saved && saved.length > 0) {
          setLocalApplications(saved);
        }
      });
    }
  }, [applications]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModal !== null) {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  // Save applications persistent handler
  const handleSaveApplications = async (apps: ApplicationRecord[]) => {
    setLocalApplications(apps);
    await saveApplications(apps);
    onSaveApplications?.(apps);
  };

  // Quick Action Panels State in Step 3
  const [isPcsoOpen, setIsPcsoOpen] = useState<boolean>(false);
  const [isSenateOpen, setIsSenateOpen] = useState<boolean>(false);
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

  // Step 1 Representative Relationship Custom Write-in State
  const [customRelation, setCustomRelation] = useState<string>(() => {
    if (
      !representative.isPatientHimself &&
      representative.relationshipToPatient &&
      !RELATIONSHIP_OPTIONS.slice(0, 11).includes(representative.relationshipToPatient as any)
    ) {
      return representative.relationshipToPatient === 'Iba pa / Other'
        ? ''
        : representative.relationshipToPatient;
    }
    return '';
  });

  const isKnownCanonicalRelation = RELATIONSHIP_OPTIONS.slice(0, 11).includes(
    representative.relationshipToPatient as any
  );
  const relationSelectValue = representative.isPatientHimself
    ? 'Self'
    : isKnownCanonicalRelation
    ? representative.relationshipToPatient
    : 'Iba pa / Other';

  const handleRelationChange = (val: string) => {
    if (val === 'Iba pa / Other') {
      onUpdateRepresentative({
        ...representative,
        relationshipToPatient: customRelation.trim() ? customRelation.trim() : 'Iba pa / Other',
      });
    } else {
      onUpdateRepresentative({
        ...representative,
        relationshipToPatient: val,
      });
      clearFieldError('representativeRelationship');
    }
  };

  const handleCustomRelationChange = (val: string) => {
    setCustomRelation(val);
    onUpdateRepresentative({
      ...representative,
      relationshipToPatient: val.trim() ? val : 'Iba pa / Other',
    });
    if (val.trim()) {
      clearFieldError('representativeRelationship');
    }
  };

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
      ? `📋 TulongPH Medical Checklist\nPara kay: ${patientName}\nOspital: ${hospital}\nBalanse sa Bill: ₱${netBal}\n\nMga Kailangang Dokumento:\n${docListFormatted}\n\n💡 Paalala: Siguraduhing malinaw ang bawat kopya at hindi lalampas sa 2MB ang bawat PDF file para sa PCSO at Senado.\nMag-organisa sa: https://tulongph.gov.ph`
      : `📋 TulongPH Medical Checklist\nPatient: ${patientName}\nHospital: ${hospital}\nRemaining Bill: ₱${netBal}\n\nRequired Documents:\n${docListFormatted}\n\n💡 Reminder: Ensure all scans/photos are clear and under 2MB PDF per file for PCSO & Senate.\nOrganize at: https://tulongph.gov.ph`;

    const shareData = {
      title: 'TulongPH Medical Checklist',
      text: shareText,
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
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

  // Field validation and error clearance helpers
  const isFieldInvalid = (fieldKey: string) => Boolean(touched[fieldKey] && errors[fieldKey]);

  const clearFieldError = (fieldKey: string) => {
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
    if (bannerError) {
      setBannerError(null);
    }
  };

  // Step 1 Validation Gate
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!patient.firstName || !patient.firstName.trim()) {
      newErrors.firstName =
        language === 'taglish'
          ? 'Pakisulat ang first name ng pasyente'
          : 'First name is required';
    }

    if (!patient.lastName || !patient.lastName.trim()) {
      newErrors.lastName =
        language === 'taglish'
          ? 'Pakisulat ang last name ng pasyente'
          : 'Last name is required';
    }

    const digitsOnly = (patient.contactNumber || '').replace(/\D/g, '');
    if (!patient.contactNumber || !patient.contactNumber.trim()) {
      newErrors.contactNumber =
        language === 'taglish'
          ? 'Pakisulat ang contact number ng pasyente'
          : 'Contact number is required';
    } else if (digitsOnly.length < 7) {
      newErrors.contactNumber =
        language === 'taglish'
          ? 'Dapat hindi bababa sa 7 digits ang contact number'
          : 'Contact number must be at least 7 digits';
    }

    if (!representative.isPatientHimself) {
      if (!representative.fullName || !representative.fullName.trim()) {
        newErrors.representativeFullName =
          language === 'taglish'
            ? 'Pakisulat ang pangalan ng kinatawan'
            : 'Representative name is required';
      }
      if (
        !representative.relationshipToPatient ||
        !representative.relationshipToPatient.trim() ||
        representative.relationshipToPatient === 'Iba pa / Other'
      ) {
        newErrors.representativeRelationship =
          language === 'taglish'
            ? 'Pakitukoy ang inyong relasyon sa pasyente'
            : 'Please specify your relationship to the patient';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const newTouched: Record<string, boolean> = {
        firstName: true,
        lastName: true,
        contactNumber: true,
      };
      if (!representative.isPatientHimself) {
        newTouched.representativeFullName = true;
        newTouched.representativeRelationship = true;
      }
      setTouched((prev) => ({ ...prev, ...newTouched }));

      setBannerError(
        language === 'taglish'
          ? 'Pakisulat ang pangalan at contact number ng pasyente bago magpatuloy.'
          : 'Please provide the patient name and contact number before continuing.'
      );

      const firstErrorId =
        !representative.isPatientHimself && newErrors.representativeFullName
          ? 'rep-full-name'
          : !representative.isPatientHimself && newErrors.representativeRelationship
          ? (relationSelectValue === 'Iba pa / Other' ? 'rep-relationship-other' : 'rep-relationship')
          : newErrors.firstName
          ? 'patient-first-name'
          : newErrors.lastName
          ? 'patient-last-name'
          : newErrors.contactNumber
          ? 'patient-contact'
          : null;

      if (firstErrorId) {
        setTimeout(() => {
          const el = document.getElementById(firstErrorId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
        }, 50);
      }

      return false;
    }

    setBannerError(null);
    return true;
  };

  const handleNextToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      setBannerError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 2 Validation Gate
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!medicalCase.diagnosis || !medicalCase.diagnosis.trim()) {
      newErrors.diagnosis =
        language === 'taglish'
          ? 'Pakisulat ang diagnosis o karamdaman'
          : 'Diagnosis is required';
    }

    if (!medicalCase.hospitalName || !medicalCase.hospitalName.trim()) {
      newErrors.hospitalName =
        language === 'taglish'
          ? 'Pakisulat ang pangalan ng ospital'
          : 'Hospital name is required';
    }

    if (!medicalCase.totalHospitalBill || medicalCase.totalHospitalBill <= 0) {
      newErrors.totalHospitalBill =
        language === 'taglish'
          ? 'Kailangang mas mataas sa ₱0 ang kabuuang hospital bill'
          : 'Total hospital bill must be greater than ₱0';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setTouched((prev) => ({
        ...prev,
        diagnosis: true,
        hospitalName: true,
        totalHospitalBill: true,
      }));

      setBannerError(
        language === 'taglish'
          ? 'Pakisulat ang diagnosis, ospital, at kabuuang halaga ng bill bago magpatuloy.'
          : 'Please provide the diagnosis, hospital name, and total bill before continuing.'
      );

      const firstErrorId = newErrors.diagnosis
        ? 'case-diagnosis'
        : newErrors.hospitalName
        ? 'hospital-name'
        : newErrors.totalHospitalBill
        ? 'total-bill'
        : null;

      if (firstErrorId) {
        setTimeout(() => {
          const el = document.getElementById(firstErrorId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
        }, 50);
      }

      return false;
    }

    setBannerError(null);
    return true;
  };

  const handleGenerateRoadmap = () => {
    const result = calculateAidStacking(patient, medicalCase);
    setTriageResult(result);
    setCurrentStep(3);
    setBannerError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCalculateRoadmap = () => {
    if (validateStep2()) {
      handleGenerateRoadmap();
    }
  };

  return (
    <div className="space-y-6">
      {/* Stepper Progress */}
      <div className="bg-white rounded-2xl border border-[#E2DFD6] p-5 shadow-xs">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          {[
            { num: 1, label: language === 'taglish' ? 'Pasyente & Claimant' : 'Patient & Claimant' },
            { num: 2, label: language === 'taglish' ? 'Ospital & Sakit' : 'Hospital & Bills' },
            { num: 3, label: language === 'taglish' ? 'Aid Roadmap' : 'Aid Roadmap' },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    currentStep === s.num
                      ? 'bg-blue-600 text-white shadow-xs ring-4 ring-blue-100'
                      : currentStep > s.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {currentStep > s.num ? '✓' : s.num}
                </div>
                <span className="text-xs font-semibold text-slate-700 mt-2 text-center">
                  {s.label}
                </span>
              </div>
              {idx < 2 && (
                <div
                  className={`flex-1 h-0.5 mx-3 transition-colors ${
                    currentStep > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STEP 1: Patient and Claimant Information */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 sm:p-7 shadow-xs space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 mb-2">
              <User className="w-4 h-4 text-blue-700" />
              <span>{t.step1Title}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t.step1Subtitle}</h2>
          </div>

          {/* Filing Mode Toggle */}
          <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200">
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
            <div className="p-5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
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
                    className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-sm transition-colors focus:outline-hidden ${
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
                    id="rep-relationship"
                    name="representativeRelationship"
                    required={!representative.isPatientHimself}
                    aria-required={!representative.isPatientHimself ? 'true' : undefined}
                    aria-invalid={isFieldInvalid('representativeRelationship')}
                    value={relationSelectValue}
                    onChange={(e) => handleRelationChange(e.target.value)}
                    className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-sm font-semibold transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white ${
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
                        className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white ${
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
                  className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-sm transition-colors focus:outline-hidden ${
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
                  value={patient.middleName}
                  onChange={(e) => onUpdatePatient({ ...patient, middleName: e.target.value })}
                  placeholder="e.g. Ramos"
                  className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
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
                  className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-sm transition-colors focus:outline-hidden ${
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
                  value={patient.dateOfBirth}
                  onChange={(e) => onUpdatePatient({ ...patient, dateOfBirth: e.target.value })}
                  className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                />
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
                  inputMode="tel"
                  pattern="[0-9]*"
                  required
                  aria-required="true"
                  aria-invalid={isFieldInvalid('contactNumber')}
                  value={patient.contactNumber}
                  onChange={(e) => {
                    onUpdatePatient({ ...patient, contactNumber: e.target.value });
                    clearFieldError('contactNumber');
                  }}
                  onBlur={() => setTouched((prev) => ({ ...prev, contactNumber: true }))}
                  placeholder="0917XXXXXXX"
                  className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-sm transition-colors focus:outline-hidden ${
                    isFieldInvalid('contactNumber')
                      ? 'border-red-500 focus:ring-2 focus:ring-red-400 bg-red-50/20 text-red-950 placeholder-red-300'
                      : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 bg-white'
                  }`}
                />
                {isFieldInvalid('contactNumber') && (
                  <p className="text-xs text-red-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.contactNumber}</span>
                  </p>
                )}
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
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={patient.philhealthNumber || ''}
                  onChange={(e) =>
                    onUpdatePatient({ ...patient, philhealthNumber: e.target.value })
                  }
                  placeholder="12-digit PhilHealth PIN"
                  className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="patient-barangay"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                >
                  {t.barangay}
                </label>
                <input
                  id="patient-barangay"
                  name="barangay"
                  type="text"
                  value={patient.address.barangay}
                  onChange={(e) =>
                    onUpdatePatient({
                      ...patient,
                      address: { ...patient.address, barangay: e.target.value },
                    })
                  }
                  placeholder="e.g. Brgy. 142"
                  className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                />
              </div>
              <div>
                <label
                  htmlFor="patient-city"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                >
                  {t.cityMunicipality}
                </label>
                <input
                  id="patient-city"
                  name="cityMunicipality"
                  type="text"
                  value={patient.address.cityMunicipality}
                  onChange={(e) =>
                    onUpdatePatient({
                      ...patient,
                      address: { ...patient.address, cityMunicipality: e.target.value },
                    })
                  }
                  placeholder="e.g. Manila / Quezon City"
                  className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                />
              </div>
              <div>
                <label
                  htmlFor="patient-province"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                >
                  {t.province}
                </label>
                <input
                  id="patient-province"
                  name="province"
                  type="text"
                  value={patient.address.province}
                  onChange={(e) =>
                    onUpdatePatient({
                      ...patient,
                      address: { ...patient.address, province: e.target.value },
                    })
                  }
                  placeholder="e.g. Metro Manila / Cavite"
                  className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                />
              </div>
            </div>

            {/* Special Socioeconomic Qualifications */}
            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">
                {language === 'taglish'
                  ? 'Mga Espesyal na Kwalipikasyon (Mag-check ng angkop):'
                  : 'Special Categories & Eligibility Boosters:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label
                  htmlFor="patient-is-senior"
                  className="min-h-11 flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <span className="min-h-11 min-w-11 flex items-center justify-center p-2 cursor-pointer">
                    <input
                      id="patient-is-senior"
                      name="isSeniorCitizen"
                      type="checkbox"
                      checked={patient.isSeniorCitizen}
                      onChange={(e) =>
                        onUpdatePatient({ ...patient, isSeniorCitizen: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </span>
                  <span className="text-sm font-semibold text-slate-700 select-none">{t.isSenior}</span>
                </label>

                <label
                  htmlFor="patient-is-pwd"
                  className="min-h-11 flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <span className="min-h-11 min-w-11 flex items-center justify-center p-2 cursor-pointer">
                    <input
                      id="patient-is-pwd"
                      name="isPWD"
                      type="checkbox"
                      checked={patient.isPWD}
                      onChange={(e) => onUpdatePatient({ ...patient, isPWD: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </span>
                  <span className="text-sm font-semibold text-slate-700 select-none">{t.isPWD}</span>
                </label>

                <label
                  htmlFor="patient-is-4ps"
                  className="min-h-11 flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <span className="min-h-11 min-w-11 flex items-center justify-center p-2 cursor-pointer">
                    <input
                      id="patient-is-4ps"
                      name="is4PsBeneficiary"
                      type="checkbox"
                      checked={patient.is4PsBeneficiary}
                      onChange={(e) =>
                        onUpdatePatient({ ...patient, is4PsBeneficiary: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </span>
                  <span className="text-sm font-semibold text-slate-700 select-none">{t.is4Ps}</span>
                </label>

                <label
                  htmlFor="patient-is-ofw"
                  className="min-h-11 flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <span className="min-h-11 min-w-11 flex items-center justify-center p-2 cursor-pointer">
                    <input
                      id="patient-is-ofw"
                      name="isOFWOrDependent"
                      type="checkbox"
                      checked={patient.isOFWOrDependent}
                      onChange={(e) =>
                        onUpdatePatient({ ...patient, isOFWOrDependent: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </span>
                  <span className="text-sm font-semibold text-slate-700 select-none">{t.isOFW}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Empathetic Error Banner if Validation Fails */}
          {bannerError && currentStep === 1 && (
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
              type="button"
              onClick={handleNextToStep2}
              className="h-11 min-h-11 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
            >
              <span>{language === 'taglish' ? 'Susunod: Detalye ng Ospital' : 'Next: Hospital & Case'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Emergency & Hospital Details */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-[#E2DFD6] p-6 sm:p-7 shadow-xs space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 mb-2">
              <HeartPulse className="w-4 h-4 text-blue-700" />
              <span>{t.step2Title}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t.step2Subtitle}</h2>
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
                id="case-category"
                name="category"
                value={medicalCase.category}
                onChange={(e) =>
                  onUpdateMedicalCase({
                    ...medicalCase,
                    category: e.target.value as EmergencyCategory,
                  })
                }
                className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
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
                className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-sm transition-colors focus:outline-hidden ${
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

            {/* Hospital Classification & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="hospital-type"
                  className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5"
                >
                  {t.hospitalType}
                </label>
                <select
                  id="hospital-type"
                  name="hospitalType"
                  value={medicalCase.hospitalType}
                  onChange={(e) =>
                    onUpdateMedicalCase({
                      ...medicalCase,
                      hospitalType: e.target.value as HospitalType,
                      hasMalasakitCenter: e.target.value.startsWith('public'),
                    })
                  }
                  className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                >
                  <option value="public_doh">{t.publicDOH} (Malasakit Active)</option>
                  <option value="public_lgu">{t.publicLGU}</option>
                  <option value="private">{t.privateHosp}</option>
                </select>
              </div>
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
                    required
                    aria-required="true"
                    aria-autocomplete="list"
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
                      language === 'taglish'
                        ? 'Hal. Philippine General Hospital, Heart Center, EAMC'
                        : 'e.g. Philippine General Hospital, Heart Center, EAMC'
                    }
                    className={`w-full h-11 min-h-11 py-2.5 px-3.5 pr-10 rounded-lg border text-sm transition-colors focus:outline-hidden ${
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
                    role="listbox"
                    aria-label="Malasakit Centers Directory"
                    className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150"
                  >
                    <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>160+ Malasakit Centers Directory</span>
                      <span className="text-blue-600 font-semibold">{hospitalSuggestions.length} found</span>
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
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{center.hospitalName}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate pl-5">
                            {center.address} • {center.provinceOrCity}
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Malasakit Desk
                          </span>
                          <span className="text-[10px] text-slate-600">
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

                {/* Active Malasakit Facility Indicator */}
                {medicalCase.hasMalasakitCenter && medicalCase.hospitalName && (
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
            </div>

            {/* Financials & Deduction Calculator */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {language === 'taglish' ? 'Kalkulador ng Balanse ng Bill' : 'Hospital Bill Breakdown (₱)'}
              </h3>
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
                    className={`w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border text-sm font-bold transition-colors focus:outline-hidden ${
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
                    className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
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
                    className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-sm font-bold text-emerald-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              {/* Net Result Bar */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white mt-2 shadow-xs">
                <span className="text-sm font-bold text-slate-200">{t.netRemaining}:</span>
                <span className="text-xl font-bold text-amber-300">
                  ₱ {medicalCase.netRemainingBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Empathetic Error Banner if Validation Fails */}
          {bannerError && currentStep === 2 && (
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
                setCurrentStep(1);
                setBannerError(null);
              }}
              className="h-11 min-h-11 inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'taglish' ? 'Bumalik' : 'Back'}</span>
            </button>
            <button
              type="button"
              onClick={handleCalculateRoadmap}
              className="h-11 min-h-11 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{t.calculateRoadmap}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Personalized Aid Stacking Roadmap */}
      {currentStep === 3 && triageResult && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-white border border-[#E2DFD6] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-200 mb-2 inline-block">
                  OPTIMIZED SEQUENCE READY
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {language === 'taglish'
                    ? 'Ang Inyong Aid Stacking Roadmap'
                    : 'Your Personalized Aid Stacking Roadmap'}
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
                <div className="text-lg font-bold text-emerald-800 mt-0.5">
                  {triageResult.estimatedCoverageRange}
                </div>
              </div>
            </div>

            {/* Official Assistance Stacking Sequence Architecture Display */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {language === 'taglish'
                  ? 'Tamang Pagkasunod-sunod ng Paglapit (Aid Stacking Sequence):'
                  : 'Assistance Stacking Sequence (Order of Application):'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span className="text-xs font-bold text-blue-900">PhilHealth Case Rate</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    {language === 'taglish'
                      ? 'Unang kaltas sa billing desk bago ang lahat.'
                      : 'Mandatory first deduction at hospital billing.'}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span className="text-xs font-bold text-emerald-900">PCSO MAP</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    {language === 'taglish'
                      ? 'GL para sa gamot, dialysis, implants, o bill.'
                      : 'Guarantee Letter for chemo, implants, or bills.'}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span className="text-xs font-bold text-indigo-900">Malasakit Center</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    {language === 'taglish'
                      ? 'In-hospital desk para sa pondo ng DOH MAIP.'
                      : 'In-hospital one-stop shop tapping DOH-MAIP.'}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      4
                    </span>
                    <span className="text-xs font-bold text-amber-950">DSWD AICS</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    {language === 'taglish'
                      ? 'Cash aid sa gamot sa labas, pamasahe, o libing.'
                      : 'Cash aid for exterior pharmacy and emergency travel.'}
                  </p>
                </div>
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

          {/* Prominent Printable Forms Callout Card */}
          <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-900">
                <Printer className="w-5 h-5 text-blue-600 shrink-0" />
                <h3 className="text-base font-bold">
                  {language === 'taglish'
                    ? 'Kailangan ng Pisikal na Papel sa Social Worker Desk?'
                    : 'Physical Forms Needed at the Hospital Desk?'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                {language === 'taglish'
                  ? 'I-print ang pre-filled na Malasakit Unified Intake Sheet at DSWD AICS Certificate of Eligibility para may dalang kumpletong papel sa social worker.'
                  : 'Download and print pre-filled Malasakit Unified Intake Sheets and DSWD AICS Certificates ready for social worker desks.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('print_forms')}
              className="h-11 min-h-11 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {language === 'taglish'
                  ? 'Mag-print ng Malasakit & DSWD Forms'
                  : 'Print Malasakit & DSWD Forms (PDF)'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Panels: Direct Launch/Collapse for PCSO and Senate */}
          <div className="space-y-4">
            {/* PCSO 7:00 AM Queue Tracker Quick Action Panel */}
            <div className="bg-white rounded-2xl border border-[#E2DFD6] shadow-xs overflow-hidden">
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        PCSO 7:00 AM Queue Tracker
                      </h3>
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
                    <p className="text-xs text-slate-600 mt-0.5">
                      {language === 'taglish'
                        ? 'Lunes hanggang Biyernes, 7:00 AM - 12:00 PM ang filing window. Mahigpit ang 2MB PDF per file limit.'
                        : 'Weekdays 7:00 AM - 12:00 PM submission window with strict 2.0MB PDF maximum limits.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setActiveModal('pcso')}
                    className="h-11 min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Buksan ang PCSO Assistant</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPcsoOpen(!isPcsoOpen)}
                    aria-expanded={isPcsoOpen}
                    className="h-11 min-h-11 min-w-11 inline-flex items-center justify-center p-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title={isPcsoOpen ? 'Collapse panel' : 'Expand panel'}
                  >
                    {isPcsoOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isPcsoOpen && (
                <div className="p-6 space-y-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Philippine Standard Time (GMT+8)
                      </div>
                      <div className="text-xl font-bold text-slate-900 mt-1">{phTime || 'Loading...'}</div>
                      <p className="text-xs text-slate-600 mt-1">
                        {isMorningQueueWindow
                          ? 'Bukas ang submission portal ngayon hanggang 12:00 PM.'
                          : 'Magbubukas ang portal sa susunod na weekday ganap na 7:00 AM.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                        2.0MB Single-PDF Checklist
                      </div>
                      <ul className="text-xs text-slate-700 space-y-1 mt-1.5 list-disc list-inside">
                        <li>Original Medical Abstract (Signed with License No.)</li>
                        <li>Statement of Account (Net of PhilHealth)</li>
                        <li>Valid ID ng Pasyente at Kinatawan</li>
                        <li>Signed Authorization Letter & Katunayan ng Relasyon</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal('pcso')}
                      className="h-11 min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      <span>Pumunta sa Buong PCSO Assistant</span>
                    </button>
                    <a
                      href="https://www.pcso.gov.ph"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-colors"
                    >
                      <span>Buksan ang pcso.gov.ph E-Services</span>
                      <ExternalLink className="w-4 h-4 text-slate-600" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Senate Assistance 90-Day Tracker Quick Action Panel */}
            <div className="bg-white rounded-2xl border border-[#E2DFD6] shadow-xs overflow-hidden">
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        Senate Assistance 90-Day Tracker
                      </h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 border border-blue-200">
                        90-Day Cooldown Policy
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {language === 'taglish'
                        ? 'Ang tulong medikal sa pamamagitan ng Guarantee Letter ay maaari lamang ma-avail kada 90 araw.'
                        : 'Senate medical assistance Guarantee Letters require a 90-day cooldown between requests.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setActiveModal('senate')}
                    className="h-11 min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Buksan ang Senate Helper</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSenateOpen(!isSenateOpen)}
                    aria-expanded={isSenateOpen}
                    className="h-11 min-h-11 min-w-11 inline-flex items-center justify-center p-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title={isSenateOpen ? 'Collapse panel' : 'Expand panel'}
                  >
                    {isSenateOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isSenateOpen && (
                <div className="p-6 space-y-4 bg-white">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        {language === 'taglish'
                          ? 'Pre-Formatted na Sulat ng Kahilingan:'
                          : 'Pre-Formatted Justification Letter:'}
                      </span>
                      <button
                        type="button"
                        onClick={copyJustification}
                        className="h-11 min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors shadow-xs cursor-pointer"
                      >
                        {copiedJustification ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-600" />
                        )}
                        <span>{copiedJustification ? 'Copied' : 'Kopyahin ang Sulat'}</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 italic bg-white p-3.5 rounded-lg border border-slate-200 leading-relaxed">
                      &ldquo;{justification}&rdquo;
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal('senate')}
                      className="h-11 min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pumunta sa Buong Senate Assistant & Tracker</span>
                    </button>
                    <a
                      href="https://assist.senate.gov.ph"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-11 min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-colors"
                    >
                      <span>Buksan ang assist.senate.gov.ph</span>
                      <ExternalLink className="w-4 h-4 text-slate-600" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stacking Steps List */}
          <div className="space-y-4">
            {triageResult.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="bg-white rounded-2xl border border-[#E2DFD6] p-6 shadow-xs transition-all hover:border-blue-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      #{step.stepNumber}
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded">
                        {step.agencyName}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {language === 'taglish' ? step.actionTitleTl : step.actionTitleEn}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 pl-12 sm:pl-0">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <Clock className="w-4 h-4 text-blue-600" />
                      {step.estimatedTime}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed pl-12">
                  {language === 'taglish' ? step.explanationTl : step.explanationEn}
                </p>

                {/* In-Situ Hospital Desk Matching inside Malasakit Section */}
                {step.agencyId === 'doh_malasakit' && (
                  <div className="pl-12 mt-4">
                    {matchedMalasakitCenter ? (
                      <div className="p-5 rounded-2xl bg-indigo-50/90 border-2 border-indigo-200 space-y-3.5 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200/80 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Building className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-indigo-950">
                                  {language === 'taglish' ? 'Inyong Malasakit Center Desk' : 'Your In-Hospital Malasakit Center Desk'}
                                </h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                                  Matched Facility
                                </span>
                              </div>
                              <p className="text-xs text-indigo-900/80 font-medium">
                                {matchedMalasakitCenter.hospitalType}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 space-y-1">
                            <span className="font-bold text-slate-800 block text-xs">
                              {matchedMalasakitCenter.hospitalName}
                            </span>
                            <div className="flex items-start gap-1.5 text-slate-600">
                              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              <span>{matchedMalasakitCenter.address} ({matchedMalasakitCenter.provinceOrCity})</span>
                            </div>
                          </div>

                          <div className="p-3 bg-white/90 rounded-xl border border-indigo-100 space-y-1">
                            <span className="font-bold text-slate-800 block text-xs">
                              {language === 'taglish' ? 'Oras ng Operasyon:' : 'Operating Hours:'}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>{matchedMalasakitCenter.operatingHours}</span>
                            </div>
                          </div>
                        </div>

                        {/* Direct Call & Copy Phone */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <a
                            href={`tel:${parseDialableNumber(matchedMalasakitCenter.contactNumber)}`}
                            className="h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                          >
                            <Phone className="w-4 h-4" />
                            <span>
                              {language === 'taglish'
                                ? `Tawagan: ${matchedMalasakitCenter.contactNumber}`
                                : `Call: ${matchedMalasakitCenter.contactNumber}`}
                            </span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleCopyCenterPhone(matchedMalasakitCenter.contactNumber)}
                            className="h-11 px-4 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-950 font-bold text-xs inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                          >
                            {copiedCenterPhone ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span>{language === 'taglish' ? 'Na-kopya!' : 'Copied!'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-indigo-700" />
                                <span>{language === 'taglish' ? 'Kopyahin ang Telepono' : 'Copy Phone Number'}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Helpful Reminder */}
                        <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <span className="font-semibold leading-relaxed">
                            &ldquo;Pumunta sa Social Service o Malasakit Desk bago lumabas ng ospital upang ma-apply ang MAIP at PCSO assistance.&rdquo;
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>
                            {language === 'taglish'
                              ? `Pumunta sa Medical Social Services ng ${medicalCase.hospitalName || 'ospital'} para sa DOH-MAIP evaluation.`
                              : `Visit the Medical Social Services of ${medicalCase.hospitalName || 'the hospital'} for DOH-MAIP evaluation.`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('malasakit')}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto"
                        >
                          {language === 'taglish' ? 'Tingnan Lahat ng Malasakit Desks' : 'Browse All Malasakit Desks'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Target Expense & Action Launchers */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200 pl-12">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-800">Target Expense:</span>{' '}
                    {step.targetExpense}
                  </div>

                  <div className="flex items-center gap-2">
                    {step.agencyId === 'senate_assist' && (
                      <button
                        type="button"
                        onClick={() => setActiveModal('senate')}
                        className="h-11 min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                      >
                        <span>Open Senate Helper</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    {step.agencyId === 'pcso_map' && (
                      <button
                        type="button"
                        onClick={() => setActiveModal('pcso')}
                        className="h-11 min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                      >
                        <span>Prepare PCSO Queue</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    {step.agencyId === 'doh_malasakit' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('print_forms')}
                          className="h-11 min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-bold transition-colors shadow-xs cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>{language === 'taglish' ? 'I-print ang Form' : 'Print Form'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('malasakit')}
                          className="h-11 min-h-11 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
                        >
                          <span>Find Malasakit Desk</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                  className="h-11 min-h-11 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
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
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
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
                          <p className="text-[11px] text-slate-500 leading-relaxed">
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
                setCurrentStep(2);
                setBannerError(null);
              }}
              className="h-11 min-h-11 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors w-full sm:w-auto cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'taglish' ? 'Baguhin ang Datos' : 'Edit Details'}</span>
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onNavigateToTab('print_forms')}
                className="h-11 min-h-11 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-colors w-full sm:w-auto cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'taglish' ? 'I-print ang mga Form (PDF)' : 'Print Forms (PDF)'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTab('vault')}
                className="h-11 min-h-11 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-colors w-full sm:w-auto cursor-pointer"
              >
                <span>{language === 'taglish' ? 'Document Vault (<2MB)' : 'Document Vault (<2MB)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Contrast Civic Editorial Modal Overlay for Embedded Full Assistants */}
      {activeModal !== null && (
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
                        : 'bg-blue-100 text-blue-950 border-blue-300'
                    }`}
                  >
                    {activeModal === 'pcso' ? 'PCSO MAP DIRECT ASSISTANT' : 'SENATE SPAO 90-DAY TRACKER'}
                  </span>
                </div>
                <h2 id="embedded-assistant-title" className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {activeModal === 'pcso'
                    ? (language === 'taglish'
                        ? 'PCSO Medical Assistance Program (MAP) Assistant'
                        : 'PCSO Medical Assistance Program (MAP) Assistant')
                    : (language === 'taglish'
                        ? 'Senate Public Assistance Office (SPAO) Tracker'
                        : 'Senate Public Assistance Office (SPAO) Tracker')}
                </h2>
                <p id="embedded-assistant-desc" className="text-xs sm:text-sm text-slate-600 font-medium">
                  {activeModal === 'pcso'
                    ? (language === 'taglish'
                        ? 'Live Philippine Time tracker para sa 7:00 AM queue, 2.0MB single-PDF compliance, at opisyal na gabay.'
                        : 'Live Philippine Standard Time tracker for the 7:00 AM queue, 2.0MB PDF compliance, and official guidance.')
                    : (language === 'taglish'
                        ? 'Pre-formatted Guarantee Letter (GL) request letter, 90-day cooldown tracker, at record keeper.'
                        : 'Pre-formatted Guarantee Letter (GL) request letter, 90-day cooldown policy tracker, and record keeper.')}
                </p>
              </div>

              {/* Prominent Back to Roadmap Button */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="h-11 min-h-11 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-colors cursor-pointer shrink-0"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
