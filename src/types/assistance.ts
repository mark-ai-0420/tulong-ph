export type Language = 'taglish' | 'en';

export type EmergencyCategory =
  | 'hospitalization'
  | 'dialysis'
  | 'chemotherapy'
  | 'surgery_implants'
  | 'prescription_medicines'
  | 'laboratory_diagnostics'
  | 'burial_funeral'
  | 'transportation_emergency'
  | 'food_calamity';

export type HospitalType = 'public_doh' | 'public_lgu' | 'private';

export type SocioeconomicClass = 'indigent' | 'low_income' | 'minimum_wage' | 'middle_income';

export interface PatientProfile {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  civilStatus: 'single' | 'married' | 'widowed' | 'separated';
  contactNumber: string;
  email: string;
  address: {
    street: string;
    barangay: string;
    cityMunicipality: string;
    province: string;
    region: string;
  };
  philhealthNumber?: string;
  isSeniorCitizen: boolean;
  isPWD: boolean;
  is4PsBeneficiary: boolean;
  isOFWOrDependent: boolean;
  socioeconomicClass: SocioeconomicClass;
  monthlyHouseholdIncome?: number;
}

export interface RepresentativeProfile {
  isPatientHimself: boolean;
  fullName: string;
  relationshipToPatient: string;
  contactNumber: string;
  email: string;
  validIdType: string;
  validIdNumber: string;
}

export interface MedicalCase {
  category: EmergencyCategory;
  diagnosis: string;
  hospitalName: string;
  hospitalType: HospitalType;
  hospitalCity: string;
  hasMalasakitCenter: boolean;
  attendingPhysician: string;
  physicianLicenseNo?: string;
  totalHospitalBill: number;
  philhealthDeduction: number;
  seniorPwdDiscount: number;
  netRemainingBalance: number;
  neededAssistanceType: 'guarantee_letter' | 'cash_medicine' | 'burial_help' | 'transport_fare';
  dateAdmitted?: string;
}

export type DocumentType =
  | 'clinical_abstract'
  | 'statement_of_account'
  | 'barangay_indigency'
  | 'patient_valid_id'
  | 'representative_valid_id'
  | 'authorization_letter'
  | 'proof_of_relationship'
  | 'social_case_study'
  | 'doctor_prescription'
  | 'death_certificate';

export interface StoredDocument {
  id: string;
  docType: DocumentType;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  mimeType: string;
  dataUrl?: string; // base64 or object URL for preview
  uploadedAt: string;
  isCompliantUnder2MB: boolean;
}

export interface ApplicationRecord {
  id: string;
  agencyId: 'senate_assist' | 'pcso_map' | 'doh_malasakit' | 'dswd_aics';
  referenceNumber: string;
  submissionDate: string;
  status: 'draft' | 'submitted' | 'processing' | 'gl_issued' | 'claimed' | 'rejected';
  amountGranted?: number;
  glValidUntil?: string;
  canReapplyDate?: string; // e.g. 90 days for Senate Assist
  notes?: string;
}

export interface AgencyRequirementDef {
  docType: DocumentType;
  nameEn: string;
  nameTl: string;
  descriptionEn: string;
  descriptionTl: string;
  isMandatory: boolean;
}

export interface AgencyInfo {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  category: 'national_gl' | 'in_hospital' | 'cash_crisis' | 'insurance' | 'specialized';
  officialUrl: string;
  hotline: string;
  processingTime: string;
  assistanceType: 'Guarantee Letter (GL)' | 'Direct Bill Credit' | 'Cash / Financial' | 'Mixed';
  descriptionEn: string;
  descriptionTl: string;
  eligibilityEn: string[];
  eligibilityTl: string[];
  requiredDocs: DocumentType[];
  howToApplyStepsEn: string[];
  howToApplyStepsTl: string[];
  tipsEn: string[];
  tipsTl: string[];
  reapplicationPolicy: string;
}

export interface StackingStep {
  stepNumber: number;
  agencyId: string;
  agencyName: string;
  actionTitleEn: string;
  actionTitleTl: string;
  explanationEn: string;
  explanationTl: string;
  targetExpense: string;
  estimatedTime: string;
  priorityScore: number;
  requiredDocuments: DocumentType[];
}
