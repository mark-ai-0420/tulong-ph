'use client';
import { WizardStepper } from '@/components/shared/WizardStepper';

import React, { useState, useEffect } from 'react';

import { PatientProfile, RepresentativeProfile, MedicalCase, StoredDocument, ApplicationRecord } from '@/types/assistance';
import { calculateAidStacking, TriageResult } from '@/lib/triageEngine';
import { Language, translations } from '@/lib/i18n';

import { saveApplications, loadApplications } from '@/lib/storage';

import { DetailedBillBreakdown } from '@/lib/billingCalculator';

import { TriageStep1Patient, RELATIONSHIP_OPTIONS } from './triage/TriageStep1Patient';
import { TriageStep2Hospital } from './triage/TriageStep2Hospital';
import { TriageStep3Roadmap } from './triage/TriageStep3Roadmap';
import { TriageAssistantModals } from './triage/TriageAssistantModals';

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
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward' | null>(null);
  const navigateToStep = (step: number) => {
    if (step === currentStep) return;
    setStepDirection(step > currentStep ? 'forward' : 'backward');
    setCurrentStep(step);
  };
  const stepMotionClass = stepDirection ? `step-enter-${stepDirection} motion-reduce:animate-none` : '';
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Modal State for Embedded Full Assistants & Infographic (PCSO / Senate / PACe / LGU / Infographic / Transfer Rights)
  const [activeModal, setActiveModal] = useState<'pcso' | 'senate' | 'pace' | 'lgu_congressional' | 'infographic' | 'transfer_rights' | null>(null);
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

  const calculatedAge = getPatientAge();

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
            el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
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
      navigateToStep(2);
      setBannerError(null);
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
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
            el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
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
    navigateToStep(3);
    setBannerError(null);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  const handleCalculateRoadmap = () => {
    if (validateStep2()) {
      handleGenerateRoadmap();
    }
  };

  return (
    <div className="space-y-6">
      <WizardStepper itemElement="div" currentStep={currentStep} onStepChange={(step) => {
        if (step === 3) { handleGenerateRoadmap(); return; }
        navigateToStep(step); setBannerError(null);
      }} steps={[
        { title: language === 'taglish' ? 'Pasyente' : 'Patient', subtitle: language === 'taglish' ? 'Sino ang may sakit?' : 'Who is the patient?', ariaLabel: language === 'taglish' ? 'Hakbang 1: 1. Pasyente' : 'Hakbang 1: 1. Patient' },
        { title: language === 'taglish' ? 'Ospital at Bill' : 'Hospital & Bill', subtitle: language === 'taglish' ? 'Magkano ang babayaran?' : 'How much is the bill?', ariaLabel: language === 'taglish' ? 'Hakbang 2: 2. Ospital at Bill' : 'Hakbang 2: 2. Hospital & Bill' },
        { title: language === 'taglish' ? 'Gabay sa Tulong' : 'Aid Roadmap', subtitle: language === 'taglish' ? 'Paano mababawasan?' : 'Step-by-step aid', ariaLabel: language === 'taglish' ? 'Hakbang 3: 3. Gabay sa Tulong' : 'Hakbang 3: 3. Aid Roadmap' },
      ]} />

      {currentStep === 1 && (
        <TriageStep1Patient
          calculatedAge={calculatedAge}
          patient={patient}
          representative={representative}
          language={language}
          onUpdatePatient={onUpdatePatient}
          onUpdateRepresentative={onUpdateRepresentative}
          stepMotionClass={stepMotionClass}
          bannerError={bannerError}
          errors={errors}
          isFieldInvalid={isFieldInvalid}
          clearFieldError={clearFieldError}
          setTouched={setTouched}
          relationSelectValue={relationSelectValue}
          customRelation={customRelation}
          handleRelationChange={handleRelationChange}
          handleCustomRelationChange={handleCustomRelationChange}
          handleNextToStep2={handleNextToStep2}
        />
      )}

      {currentStep === 2 && (
        <TriageStep2Hospital
          getPatientAge={getPatientAge}
          calculatedAge={calculatedAge}
          setBannerError={setBannerError}
          patient={patient}
          medicalCase={medicalCase}
          language={language}
          onUpdateMedicalCase={onUpdateMedicalCase}
          stepMotionClass={stepMotionClass}
          bannerError={bannerError}
          errors={errors}
          isFieldInvalid={isFieldInvalid}
          clearFieldError={clearFieldError}
          setTouched={setTouched}
          navigateToStep={navigateToStep}
          handleCalculateRoadmap={handleCalculateRoadmap}
          showRa11463Details={showRa11463Details}
          setShowRa11463Details={setShowRa11463Details}
          autoCalculationState={autoCalculationState}
          setAutoCalculationState={setAutoCalculationState}
        />
      )}

      {currentStep === 3 && triageResult && (
        <TriageStep3Roadmap
          setBannerError={setBannerError}
          patient={patient}
          representative={representative}
          medicalCase={medicalCase}
          documents={documents}
          language={language}
          onNavigateToTab={onNavigateToTab}
          stepMotionClass={stepMotionClass}
          navigateToStep={navigateToStep}
          triageResult={triageResult}
          roadmapSearchQuery={roadmapSearchQuery}
          setRoadmapSearchQuery={setRoadmapSearchQuery}
          setActiveModal={setActiveModal}
          localApplications={localApplications}
          handleSaveApplications={handleSaveApplications}
        />
      )}

      {activeModal !== null && (
        <TriageAssistantModals
          patient={patient}
          representative={representative}
          medicalCase={medicalCase}
          documents={documents}
          language={language}
          onNavigateToTab={onNavigateToTab}
          activeModal={activeModal}
          setActiveModal={setActiveModal}
          localApplications={localApplications}
          handleSaveApplications={handleSaveApplications}
        />
      )}
    </div>
  );
};
