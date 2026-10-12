export type EducationLevel = 'jhs' | 'shs' | 'college' | 'tvet' | 'medicine';
export type EducationSchoolType = 'public' | 'suc_luc' | 'private';
export type EducationLocation = 'NCR' | 'HUC' | 'other';

export interface StudentEducationProfile {
  fullName: string;
  schoolName: string;
  cityMunicipality: string;
  educationLevel: EducationLevel;
  schoolType: EducationSchoolType;
  location: EducationLocation;
  annualTuitionAndFees: number;
  gwa: number;
  yearLevel: number;
  age: number;
  annualHouseholdIncome: number;
  isFilipino: boolean;
  schoolParticipates: boolean;
  firstDegree: boolean;
  withinResidencyLimit: boolean;
  isIncomingFreshman: boolean;
  isExistingEsc: boolean;
  hasSHSVoucher: boolean;
  previousAnnualGrant: number;
  voucherCategory: 'public_jhs' | 'esc' | 'approved_private' | 'none';
  noLocalSUC: boolean;
  priorityCourse: boolean;
  dostQualifiedSchool: boolean;
  isSTEMGraduateOrTop5: boolean;
  is4PsOrListahanan: boolean;
  isPWD: boolean;
  isSoloParentDependent: boolean;
  isOWWADependent: boolean;
  owwaActive: boolean;
  ofwMonthlySalaryUSD: number;
  isDeceasedOFWDependent: boolean;
  isCoconutFarmerDependent: boolean;
  coconutPriorityCourse: boolean;
  isGSISDependent: boolean;
  gsisSalaryGrade: number;
  isTop10PublicHS: boolean;
  hasFamilyCrisis: boolean;
  hasOtherNationalScholarship: boolean;
  hasNC3OrHigher: boolean;
  trainingDays: number;
  regionalDailyWage: number;
  willingReturnService: boolean;
  selectedPrimaryProgram: string;
  needsLicensureReimbursement: boolean;
}

export interface EducationProgram {
  id: string;
  name: string;
  agency: string;
  statutoryBasis: string;
  benefits: string;
  eligibility: string[];
  documents: string[];
  steps: string[];
  stackingRule: string;
  sourceUrl: string;
  additionalSources?: { title: string; url: string }[];
  verifiedAsOf: string;
}

export interface EducationMatch {
  id: string;
  program: EducationProgram;
  annualCashAmount: number | null;
  tuitionAmount: number;
  oneTimeAmount: number;
  reason: string;
  condition: string;
  requiresPrimaryProgram?: string;
}

export interface EducationTriageResult {
  directTuitionRelief: number;
  netRemainingTuitionBalance: number;
  tuitionProgram: EducationProgram | null;
  primaryPrograms: EducationMatch[];
  supplementalPrograms: EducationMatch[];
  bestPrimaryAnnualStipend: number;
  selectedPrimary: EducationMatch | null;
  documentaryChecklist: string[];
  advisories: string[];
  netRemainingTuition: number;
  primaryStipendPrograms: EducationMatch[];
  stackableSupplementalPrograms: EducationMatch[];
  consolidatedChecklist: string[];
}

export interface EducationDirectoryEntry {
  id: string;
  agency: string;
  name: string;
  region: string;
  services: string;
  url: string;
  email?: string;
  phone?: string;
  address?: string;
  sourceUrl: string;
}
