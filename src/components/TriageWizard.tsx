'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Building,
  Building2,
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
  Ambulance,
  FileText,
  X,
  Phone,
  MapPin,
  Share2,
  Layers,
  Landmark,
  Zap,
  Calculator,
  Search,
  HelpCircle,
} from 'lucide-react';
import {
  PatientProfile,
  RepresentativeProfile,
  MedicalCase,
  EmergencyCategory,
  HospitalType,
  AdmissionStatus,
  StoredDocument,
  ApplicationRecord,
} from '@/types/assistance';
import { calculateAidStacking, TriageResult } from '@/lib/triageEngine';
import { Language, translations } from '@/lib/i18n';
import { PCSOAssistant } from './PCSOAssistant';
import { SenateAssistant } from './SenateAssistant';
import { PACEAssistant } from './PACEAssistant';
import { StackingInfographic } from './StackingInfographic';
import { saveApplications, loadApplications } from '@/lib/storage';
import { MALASAKIT_CENTERS_DIRECTORY, MalasakitCenterLocation } from '@/lib/data/malasakitCenters';
import { parseDialableNumber } from '@/lib/phoneUtils';
import { DOCUMENT_SLOTS } from './DocumentVault';
import { computeStatutoryDeductions, DetailedBillBreakdown } from '@/lib/billingCalculator';
import { matchPhilHealthCaseRate } from '@/lib/data/philhealthRates';

const DIAGNOSIS_PRESETS = [
  { label: 'Pneumonia (Pulmonya)', condition: 'Pneumonia (Pulmonya)', category: 'hospitalization' as EmergencyCategory },
  { label: 'Dengue Fever', condition: 'Dengue', category: 'hospitalization' as EmergencyCategory },
  { label: 'Hemodialysis', condition: 'Hemodialysis', category: 'dialysis' as EmergencyCategory },
  { label: 'Stroke (CVA)', condition: 'Stroke (CVA)', category: 'hospitalization' as EmergencyCategory },
  { label: 'CS Delivery (Panganak)', condition: 'CS Delivery (Panganak)', category: 'surgery_implants' as EmergencyCategory },
  { label: 'Appendectomy', condition: 'Appendectomy', category: 'surgery_implants' as EmergencyCategory },
] as const;

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

  // Modal State for Embedded Full Assistants & Infographic (PCSO / Senate / PACe / Infographic / Transfer Rights)
  const [activeModal, setActiveModal] = useState<'pcso' | 'senate' | 'pace' | 'infographic' | 'transfer_rights' | null>(null);
  const [localApplications, setLocalApplications] = useState<ApplicationRecord[]>(applications || []);
  const [autoCalculationState, setAutoCalculationState] = useState<DetailedBillBreakdown | null>(null);

  // Step 2 & Step 3 QoL State
  const [showRa11463Details, setShowRa11463Details] = useState<boolean>(false);
  const [roadmapSearchQuery, setRoadmapSearchQuery] = useState<string>('');

  const [prevApplications, setPrevApplications] = useState<ApplicationRecord[] | undefined>(applications);
  if (applications !== prevApplications) {
    setPrevApplications(applications);
    if (applications && applications.length > 0) {
      setLocalApplications(applications);
    }
  }

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

  // Step 1 Representative Relationship Custom Write-in State
  const [customRelation, setCustomRelation] = useState<string>(() => {
    if (
      !representative.isPatientHimself &&
      representative.relationshipToPatient &&
      !(RELATIONSHIP_OPTIONS.slice(0, 11) as readonly string[]).includes(representative.relationshipToPatient)
    ) {
      return representative.relationshipToPatient === 'Iba pa / Other'
        ? ''
        : representative.relationshipToPatient;
    }
    return '';
  });

  const isKnownCanonicalRelation = (RELATIONSHIP_OPTIONS.slice(0, 11) as readonly string[]).includes(
    representative.relationshipToPatient
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

  // Helper to compute patient age from dateOfBirth
  const getPatientAge = (): number | undefined => {
    if (!patient.dateOfBirth) return undefined;
    const dob = new Date(patient.dateOfBirth);
    if (isNaN(dob.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // Diagnosis Quick Preset Selection
  const handleSelectDiagnosisPreset = (preset: (typeof DIAGNOSIS_PRESETS)[number]) => {
    clearFieldError('diagnosis');
    const newCategory = preset.category || medicalCase.category;
    if (medicalCase.totalHospitalBill > 0) {
      const breakdown = computeStatutoryDeductions({
        totalBill: medicalCase.totalHospitalBill,
        hospitalType: medicalCase.hospitalType,
        isSeniorCitizen: patient.isSeniorCitizen,
        isPWD: patient.isPWD,
        patientAge: getPatientAge(),
        diagnosis: preset.condition,
        category: newCategory,
      });

      setAutoCalculationState(breakdown);
      onUpdateMedicalCase({
        ...medicalCase,
        diagnosis: preset.condition,
        category: newCategory,
        philhealthDeduction: Math.round(breakdown.philhealthDeductionAmount),
        seniorPwdDiscount: Math.round(breakdown.totalSeniorPwdRelief),
        netRemainingBalance: Math.round(breakdown.netRemainingBalance),
        isAutoCalculated: true,
        philhealthMatchedCondition: breakdown.philhealthMatchedCondition,
        seniorPwdVatExempt: breakdown.vatAmountRemoved,
        seniorPwdDiscountAmount: breakdown.seniorPwdDiscountAmount,
      });
    } else {
      onUpdateMedicalCase({
        ...medicalCase,
        diagnosis: preset.condition,
        category: newCategory,
      });
    }
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

  const calculatedAge = getPatientAge();
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
    } else if (digitsOnly.length !== 11 || !digitsOnly.startsWith('09')) {
      newErrors.contactNumber = t.errContactDigits;
    }

    // Optional PhilHealth validation: If provided, must be exactly 12 digits
    const philhealthDigits = (patient.philhealthNumber || '').replace(/\D/g, '');
    if (patient.philhealthNumber && patient.philhealthNumber.trim() && philhealthDigits.length !== 12) {
      newErrors.philhealthNumber = t.errPhilhealthDigits;
    }

    if (!representative.isPatientHimself) {
      if (!representative.fullName || !representative.fullName.trim()) {
        newErrors.representativeFullName = t.errRepNameRequired;
      }
      if (
        !representative.relationshipToPatient ||
        !representative.relationshipToPatient.trim() ||
        representative.relationshipToPatient === 'Iba pa / Other'
      ) {
        newErrors.representativeRelationship = t.errRepRelRequired;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const newTouched: Record<string, boolean> = {
        firstName: true,
        lastName: true,
        contactNumber: true,
      };
      if (newErrors.philhealthNumber) {
        newTouched.philhealthNumber = true;
      }
      if (!representative.isPatientHimself) {
        newTouched.representativeFullName = true;
        newTouched.representativeRelationship = true;
      }
      setTouched((prev) => ({ ...prev, ...newTouched }));

      setBannerError(
        language === 'taglish'
          ? 'Pakisuri ang mga pulang field bago magpatuloy.'
          : 'Please review the highlighted fields before continuing.'
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
          : newErrors.philhealthNumber
          ? 'patient-philhealth'
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
            {
              num: 1,
              label: language === 'taglish' ? '1. Pasyente' : '1. Patient',
              sub: language === 'taglish' ? 'Sino ang may sakit?' : 'Who is the patient?',
            },
            {
              num: 2,
              label: language === 'taglish' ? '2. Ospital at Bill' : '2. Hospital & Bill',
              sub: language === 'taglish' ? 'Magkano ang babayaran?' : 'How much is the bill?',
            },
            {
              num: 3,
              label: language === 'taglish' ? '3. Gabay sa Tulong' : '3. Aid Roadmap',
              sub: language === 'taglish' ? 'Paano mababawasan?' : 'Step-by-step aid',
            },
          ].map((s, idx) => {
            const isClickable = s.num < currentStep;
            return (
              <React.Fragment key={s.num}>
                <div
                  onClick={() => {
                    if (isClickable) {
                      setCurrentStep(s.num);
                      setBannerError(null);
                    }
                  }}
                  className={`flex flex-col items-center select-none ${
                    isClickable ? 'cursor-pointer group' : ''
                  }`}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  aria-label={`Hakbang ${s.num}: ${s.label}`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      currentStep === s.num
                        ? 'bg-blue-900 text-white shadow-xs ring-4 ring-blue-100'
                        : currentStep > s.num
                        ? 'bg-emerald-700 text-white group-hover:bg-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {currentStep > s.num ? '✓' : s.num}
                  </div>
                  <span
                    className={`text-xs font-bold mt-2 text-center ${
                      currentStep === s.num
                        ? 'text-blue-900'
                        : currentStep > s.num
                        ? 'text-emerald-800'
                        : 'text-slate-600'
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="text-xs text-slate-500 hidden sm:block text-center font-medium">
                    {s.sub}
                  </span>
                </div>
                {idx < 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                      currentStep > idx + 1 ? 'bg-emerald-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Patient and Claimant Information */}
      {currentStep === 1 && (
        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            handleNextToStep2();
          }}
          className="bg-white rounded-2xl border border-[#E2DFD6] p-6 sm:p-7 shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 mb-2">
                <User className="w-4 h-4 text-blue-700" />
                <span>{t.step1Title}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{t.step1Subtitle}</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdatePatient({
                  ...patient,
                  firstName: 'Juan',
                  middleName: 'Ramos',
                  lastName: 'Dela Cruz',
                  dateOfBirth: '1956-08-15',
                  contactNumber: '09171234567',
                  address: {
                    ...patient.address,
                    barangay: 'Barangay 123',
                    cityMunicipality: 'Manila',
                    province: 'Metro Manila',
                  },
                  socioeconomicClass: 'indigent',
                  philhealthNumber: '123456789012',
                  isSeniorCitizen: true,
                  isPWD: false,
                  is4PsBeneficiary: false,
                });
                onUpdateRepresentative({
                  ...representative,
                  fullName: 'Maria Santos Dela Cruz',
                  relationshipToPatient: 'Anak / Child',
                  isPatientHimself: false,
                  contactNumber: '09187654321',
                  email: '',
                });
                onUpdateMedicalCase({
                  ...medicalCase,
                  hospitalName: 'Philippine General Hospital',
                  hospitalType: 'public_doh',
                  hospitalCity: 'Manila',
                  diagnosis: 'Pneumonia (Pulmonya)',
                  category: 'hospitalization',
                  totalHospitalBill: 100000,
                  admissionStatus: 'confined_running_bill',
                  hasMalasakitCenter: true,
                  philhealthDeduction: 32000,
                  seniorPwdDiscount: 20000,
                  netRemainingBalance: 48000,
                });
                setErrors({});
                setBannerError(null);
              }}
              className="min-h-[44px] h-11 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/90 text-amber-950 border border-amber-300 font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-2xs transition-colors self-start sm:self-auto"
            >
              <span>💡 {t.sampleDataBtn}</span>
            </button>
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
                  autoComplete="off"
                  value={patient.address.barangay}
                  onChange={(e) =>
                    onUpdatePatient({
                      ...patient,
                      address: { ...patient.address, barangay: e.target.value },
                    })
                  }
                  placeholder="e.g. Brgy. 142"
                  className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
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
                  autoComplete="off"
                  value={patient.address.cityMunicipality}
                  onChange={(e) =>
                    onUpdatePatient({
                      ...patient,
                      address: { ...patient.address, cityMunicipality: e.target.value },
                    })
                  }
                  placeholder="e.g. Manila / Quezon City"
                  className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
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
                  autoComplete="off"
                  value={patient.address.province}
                  onChange={(e) =>
                    onUpdatePatient({
                      ...patient,
                      address: { ...patient.address, province: e.target.value },
                    })
                  }
                  placeholder="e.g. Metro Manila / Cavite"
                  className="w-full h-11 min-h-11 py-2.5 px-3.5 rounded-lg border border-slate-300 text-base sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
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
                  className={`min-h-[52px] flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    patient.isSeniorCitizen
                      ? 'bg-blue-50/80 border-blue-900 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
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
                    <span className="text-[11px] text-slate-500 font-medium">
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
                    <span className="text-[11px] text-slate-500 font-medium">
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
                    <span className="text-[11px] text-slate-500 font-medium">
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
                    <span className="text-[11px] text-slate-500 font-medium">
                      {language === 'taglish' ? 'May DMW/OWWA medical aid' : 'Eligible for DMW/OWWA aid'}
                    </span>
                  </div>
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
              type="submit"
              className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
            >
              <span>{language === 'taglish' ? 'Susunod: Detalye ng Ospital' : 'Next: Hospital & Case'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Emergency & Hospital Details */}
      {currentStep === 2 && (
        <form
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            handleCalculateRoadmap();
          }}
          className="bg-white rounded-2xl border border-[#E2DFD6] p-6 sm:p-7 shadow-xs space-y-6"
        >
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
                    labelTl: 'Naka-confine pa (Running Bill)',
                    labelEn: 'Confined (Running Bill)',
                    descTl: 'May interim SOA habang nagpapagaling',
                    descEn: 'Interim SOA during ongoing stay',
                  },
                  {
                    id: 'discharge_final_soa' as AdmissionStatus,
                    labelTl: 'Araw ng Discharge (Final SOA)',
                    labelEn: 'Discharge Day (Final SOA)',
                    descTl: 'May official final bill para sa clearing',
                    descEn: 'Final official billing for clearing',
                  },
                  {
                    id: 'outpatient' as AdmissionStatus,
                    labelTl: 'Outpatient (Dialysis / Chemo / Lab)',
                    labelEn: 'Outpatient (Dialysis / Chemo / Lab)',
                    descTl: 'Pabalik-balik na sesyon o diagnostic',
                    descEn: 'Recurring session or diagnostics',
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
                            {language === 'taglish' ? item.labelTl : item.labelEn}
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
                          {language === 'taglish' ? item.descTl : item.descEn}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Reassurance pill when Naka-confine pa is selected */}
              {(medicalCase.admissionStatus || 'confined_running_bill') === 'confined_running_bill' && (
                <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-950 text-xs font-semibold leading-relaxed flex items-start gap-2">
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

              {/* Diagnosis Quick Presets */}
              <div className="mt-2.5">
                <span className="text-xs font-semibold text-slate-500 block mb-1.5">
                  {language === 'taglish' ? 'Mabilisang Pagpili ng Karaniwang Kondisyon:' : 'Quick Presets (Common Diagnoses):'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {DIAGNOSIS_PRESETS.map((preset) => {
                    const isSelected =
                      medicalCase.diagnosis.toLowerCase().includes(preset.condition.toLowerCase().split(' ')[0]);
                    return (
                      <button
                        key={preset.condition}
                        type="button"
                        onClick={() => handleSelectDiagnosisPreset(preset)}
                        className={`min-h-[36px] sm:min-h-[32px] px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                            : 'bg-white hover:bg-stone-50 text-slate-700 border-[#E2DFD6] hover:border-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

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
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300 shrink-0" />
                  <span>⚡ Auto-Kalkulahin (PhilHealth & Senior/PWD)</span>
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
              <div id="net-remaining-balance" className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white mt-2 shadow-xs">
                <span className="text-sm font-bold text-slate-200">{t.netRemaining}:</span>
                <span id="net-remaining-amount" className="text-xl font-bold text-amber-300">
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
                          <span className="text-emerald-700 font-bold shrink-0">
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
                        <span className="text-emerald-700 font-bold shrink-0">
                          -₱{medicalCase.philhealthDeduction.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* If in DOH hospital (public_doh) and patient is Senior/PWD or indigent */}
                    {isNbbEligible && (
                      <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs font-semibold leading-relaxed flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>No Balance Billing (NBB) Entitlement: Ang nalalabing balanse ay sakop ng DOH MAIP at Malasakit Center sa basic ward.</span>
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
              className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'taglish' ? 'Bumalik' : 'Back'}</span>
            </button>
            <button
              type="submit"
              className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring"
            >
              <span>{t.calculateRoadmap}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Personalized Aid Stacking Roadmap */}
      {currentStep === 3 && triageResult && (
        <div className="space-y-6">
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
                    className="h-8 px-3 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-950 font-bold text-xs border border-blue-200 shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-900" />
                    <span>{language === 'taglish' ? 'Tingnan ang Visual Infographic' : 'View Visual Infographic'}</span>
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
                <div className="text-lg font-bold text-emerald-800 mt-0.5">
                  {triageResult.estimatedCoverageRange}
                </div>
              </div>
            </div>

            {/* Official Assistance Stacking Sequence Architecture Display */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {language === 'taglish'
                    ? 'Tamang Pagkasunod-sunod ng Paglapit (5-Pillar Aid Stacking):'
                    : 'Official Assistance Stacking Sequence (5 Pillars):'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveModal('infographic')}
                  className="text-xs font-bold text-blue-900 hover:text-blue-700 underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{language === 'taglish' ? 'Buong Gabay' : 'Full Guide'}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
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

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
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

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
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

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
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

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
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

            {/* Admission Status Operational Guidance Banner */}
            {triageResult.admissionStatusGuidance && (
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-3 shadow-2xs">
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
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
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
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      3
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Stage 3: Doctor-to-Doctor Bed Hunting (Interactive Call Directory)
                      </h4>
                      <p className="text-xs text-slate-600">
                        {language === 'taglish'
                          ? 'Tawagan ang National Referral Hub o mga DOH Specialty Center upang kumpirmahin ang bakanteng kama o ICU bed bago lumipat:'
                          : 'Contact the National Referral Hub or DOH Specialty Centers for doctor-to-doctor bed confirmation prior to departure:'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 pl-8">
                    {[
                      { name: 'NPNRC (One Hospital Command)', phone: '1555', altPhone: '0919-977-3333', desc: '24/7 National Hub' },
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
                          <div className="text-xs font-mono font-bold text-blue-900 mt-1">{target.phone}{target.altPhone ? ` / ${target.altPhone}` : ''}</div>
                        </div>
                        <div className="pt-1 flex items-center gap-1.5">
                          <a
                            href={`tel:${parseDialableNumber(target.phone)}`}
                            className="min-h-[44px] h-11 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs shadow-2xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer focus-ring flex-1"
                          >
                            <Phone className="w-3.5 h-3.5 text-blue-900" />
                            <span>Tumawag</span>
                          </a>
                          {target.altPhone && (
                            <a
                              href={`tel:${parseDialableNumber(target.altPhone)}`}
                              className="min-h-[44px] h-11 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs shadow-2xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer focus-ring flex-1"
                            >
                              <Phone className="w-3.5 h-3.5 text-blue-900" />
                              <span>Alt Mobile</span>
                            </a>
                          )}
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
                      <span className="text-emerald-700 font-bold shrink-0">•</span>
                      <span>
                        <strong>PhilHealth Case Rates:</strong> Awtomatikong statutory deduction sa bill bago kwentahin ang anumang diskwento o bayarin.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold shrink-0">•</span>
                      <span>
                        <strong>Senior/PWD 20% + 12% VAT Exemption:</strong> MANDATORY BY LAW (RA 9994 / RA 10754) sa room, laboratory, diagnostic tests, gamot, at doktor Professional Fees (PF).
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold shrink-0">•</span>
                      <span>
                        <strong>PCSO Guarantee Letter:</strong> Tanggap sa mga pribadong ospital na may aktibong MOA para sa chemo, dialysis, at operasyon.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold shrink-0">•</span>
                      <span>
                        <strong>PACe Malacañang & Senate GL:</strong> Maaring mag-isyu ng Guarantee Letter para sa malalaking deficit (₱50k+) kung accredited ang pribadong pasilidad.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold shrink-0">•</span>
                      <span>
                        <strong>DSWD AICS Direct Cash:</strong> Outright cash para sa mga mamahaling gamot na kailangang bilhin sa labas na generic pharmacies.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 🛡️ Proteksyon: Promissory Note Literacy under RA 9439 */}
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-3 shadow-2xs">
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

          {/* Prominent Printable Forms Callout Card */}
          <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-blue-900">
                <Printer className="w-5 h-5 text-blue-900 shrink-0" />
                <h3 className="text-base font-bold">
                  {language === 'taglish'
                    ? 'Kailangan ng Pisikal na Papel sa Social Worker Desk?'
                    : 'Physical Forms Needed at the Hospital Desk?'}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-normal">
                {language === 'taglish'
                  ? 'I-print ang pre-filled na Malasakit Unified Intake Sheet at DSWD AICS Certificate of Eligibility para may dalang kumpletong papel sa social worker.'
                  : 'Download and print pre-filled Malasakit Unified Intake Sheets and DSWD AICS Certificates ready for social worker desks.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('print_forms')}
              className="min-h-[44px] h-11 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring shrink-0"
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
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-amber-800" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                          Malacañang Transmittal Guide
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
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
                setCurrentStep(2);
                setBannerError(null);
              }}
              className="min-h-[44px] h-11 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs sm:text-sm shadow-2xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer focus-ring w-full sm:w-auto"
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
                        : activeModal === 'senate'
                        ? 'bg-blue-100 text-blue-950 border-blue-300'
                        : activeModal === 'pace'
                        ? 'bg-amber-100 text-amber-950 border-amber-300'
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
                    <div className="p-4.5 rounded-2xl bg-blue-50/60 border border-blue-200/90 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          3
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {language === 'taglish'
                              ? 'Stage 3: Doctor-to-Doctor Bed Hunting (Interactive Call Directory)'
                              : 'Stage 3: Doctor-to-Doctor Bed Hunting (Interactive Call Directory)'}
                          </h4>
                          <p className="text-xs text-slate-600">
                            {language === 'taglish'
                              ? 'Tawagan ang National Referral Hub o mga DOH Specialty Center upang kumpirmahin ang bakanteng kama o ICU bed bago lumipat:'
                              : 'Contact the National Referral Hub or DOH Specialty Centers for doctor-to-doctor bed confirmation prior to departure:'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1 pl-8.5">
                        {[
                          { name: 'NPNRC (One Hospital Command)', phone: '1555', altPhone: '0919-977-3333', desc: '24/7 National Hub' },
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
                              <div className="text-xs font-mono font-bold text-blue-900 mt-1">{target.phone}{target.altPhone ? ` / ${target.altPhone}` : ''}</div>
                            </div>
                            <div className="pt-1 flex items-center gap-1.5">
                              <a
                                href={`tel:${parseDialableNumber(target.phone)}`}
                                className="min-h-[44px] h-11 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs shadow-2xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer focus-ring flex-1"
                              >
                                <Phone className="w-3.5 h-3.5 text-blue-900" />
                                <span>{language === 'taglish' ? 'Tumawag' : 'Call'}</span>
                              </a>
                              {target.altPhone && (
                                <a
                                  href={`tel:${parseDialableNumber(target.altPhone)}`}
                                  className="min-h-[44px] h-11 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 text-slate-800 border border-[#E2DFD6] font-semibold text-xs shadow-2xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer focus-ring flex-1"
                                >
                                  <Phone className="w-3.5 h-3.5 text-blue-900" />
                                  <span>{language === 'taglish' ? 'Alt Mobile' : 'Alt Mobile'}</span>
                                </a>
                              )}
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
      )}
    </div>
  );
};
